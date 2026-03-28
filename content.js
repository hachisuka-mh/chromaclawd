(function () {
  'use strict';

  // Saved state — either a Range (contenteditable) or an input/textarea ref
  let savedRange = null;       // Range object for contenteditable
  let savedInput = null;       // { el, start, end } for input/textarea
  let loadingBadge = null;

  // ── Proactive selection tracking ─────────────────────────────────────────
  // Some editors (LinkedIn, etc.) clear the DOM selection when the context
  // menu opens. We snapshot on every selectionchange so captureSelection()
  // can fall back to the last known good state.

  document.addEventListener('selectionchange', () => {
    const el = document.activeElement;
    const tag = el?.tagName?.toLowerCase();

    if (tag === 'input' || tag === 'textarea') {
      const text = el.value.slice(el.selectionStart, el.selectionEnd);
      if (text) {
        savedInput = { el, start: el.selectionStart, end: el.selectionEnd };
        savedRange = null;
      }
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.toString()) {
        savedRange = sel.getRangeAt(0).cloneRange();
        savedInput = null;
      }
    }
  });

  // ── Selection capture ────────────────────────────────────────────────────

  function captureSelection() {
    const el = document.activeElement;
    const tag = el?.tagName?.toLowerCase();

    if (tag === 'input' || tag === 'textarea') {
      // Form elements use their own selection model
      savedInput = { el, start: el.selectionStart, end: el.selectionEnd };
      savedRange = null;
      return el.value.slice(el.selectionStart, el.selectionEnd);
    }

    // contenteditable and everything else
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString()) {
      savedRange = sel.getRangeAt(0).cloneRange();
      savedInput = null;
      return sel.toString();
    }

    // Fall back to proactively tracked state (handles editors that clear
    // selection when the context menu opens, e.g. LinkedIn's composer)
    if (savedInput) return savedInput.el.value.slice(savedInput.start, savedInput.end);
    if (savedRange) return savedRange.toString();
    return '';
  }

  // ── Loading badge ────────────────────────────────────────────────────────

  function showLoadingBadge() {
    removeLoadingBadge();
    let rect;

    if (savedInput) {
      rect = savedInput.el.getBoundingClientRect();
    } else if (savedRange) {
      rect = savedRange.getBoundingClientRect();
    } else {
      return;
    }

    const badge = document.createElement('div');
    badge.id = '__claude-badge__';
    badge.textContent = '✦ Claude is improving...';
    badge.style.top = `${Math.max(8, rect.top - 34)}px`;
    badge.style.left = `${rect.left}px`;
    document.body.appendChild(badge);
    loadingBadge = badge;
  }

  function removeLoadingBadge() {
    loadingBadge?.remove();
    loadingBadge = null;
  }

  // ── Text replacement ─────────────────────────────────────────────────────

  function replaceSelection(newText) {
    if (savedInput) {
      // input / textarea path
      const { el, start, end } = savedInput;
      el.focus();
      el.setSelectionRange(start, end);
      const success = document.execCommand('insertText', false, newText);
      if (!success) {
        // Direct value manipulation as fallback (loses undo history)
        el.value = el.value.slice(0, start) + newText + el.value.slice(end);
        el.setSelectionRange(start, start + newText.length);
      }
      return true;
    }

    if (savedRange) {
      // contenteditable path — focus the editor element first so execCommand works
      const container = savedRange.commonAncestorContainer;
      const node = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
      const editable = node.closest?.('[contenteditable]') ?? node;
      editable?.focus();

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);

      let success = document.execCommand('insertText', false, newText);

      if (!success) {
        // InputEvent path — works with React/modern editors (LinkedIn, Notion, etc.)
        // that listen to beforeinput rather than execCommand
        try {
          editable?.dispatchEvent(new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: newText,
          }));
          success = true;
        } catch {
          // ignore — fall through to clipboard
        }
      }

      if (!success) {
        navigator.clipboard.writeText(newText).catch(() => {});
        return false;
      }
      return true;
    }

    return false;
  }

  // ── Toast ────────────────────────────────────────────────────────────────

  function showToast(message, isError) {
    const toast = document.createElement('div');
    toast.className = `__claude-toast__ ${isError ? '__claude-toast-error__' : '__claude-toast-info__'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ── Message handler ──────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'startLoading') {
      const text = captureSelection();
      showLoadingBadge();
      sendResponse({ ok: true, text });
    }

    if (message.action === 'replace') {
      removeLoadingBadge();
      const replaced = replaceSelection(message.text);
      if (!replaced) {
        showToast("Couldn't replace — result copied to clipboard", false);
      }
      savedRange = null;
      savedInput = null;
      sendResponse({ ok: true });
    }

    if (message.action === 'showError') {
      removeLoadingBadge();
      savedRange = null;
      savedInput = null;
      showToast(message.message, true);
      sendResponse({ ok: true });
    }

    return true;
  });
})();
