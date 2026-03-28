import { DEFAULT_CONTENT_TYPES, FALLBACK_TYPE_KEY } from './defaults/prompts.js';

// ─── Pure functions (exported for testing) ───────────────────────────────────

export function detectContentType(url, contentTypes) {
  try {
    const { hostname } = new URL(url);
    for (const [key, type] of Object.entries(contentTypes)) {
      if (type.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return key;
      }
    }
  } catch {
    // invalid URL
  }
  return FALLBACK_TYPE_KEY;
}

export async function callClaude(apiKey, systemPrompt, text, model = 'claude-haiku-4-5-20251001') {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─── Chrome listeners (side effects — not exported) ──────────────────────────

async function loadContentTypes() {
  const stored = await chrome.storage.local.get('contentTypes');
  return stored.contentTypes ?? DEFAULT_CONTENT_TYPES;
}

async function setupContextMenus() {
  await new Promise(resolve => chrome.contextMenus.removeAll(resolve));

  chrome.contextMenus.create({
    id: 'claude-improve',
    title: '✦ Improve with Claude',
    contexts: ['selection'],
  });

  const contentTypes = await loadContentTypes();
  for (const [key, type] of Object.entries(contentTypes)) {
    chrome.contextMenus.create({
      id: `claude-type-${key}`,
      parentId: 'claude-improve',
      title: type.name,
      contexts: ['selection'],
    });
  }
}

chrome.runtime.onInstalled.addListener(setupContextMenus);

// Rebuild menus if the user saves new prompt config (new types could be added)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.contentTypes) setupContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const contentTypes = await loadContentTypes();

  const typeKey =
    info.menuItemId === 'claude-improve'
      ? detectContentType(tab.url, contentTypes)
      : info.menuItemId.replace('claude-type-', '');

  const contentType = contentTypes[typeKey] ?? contentTypes[FALLBACK_TYPE_KEY];

  // Ask content script to capture the selection and return the full text
  let captureResult;
  try {
    captureResult = await chrome.tabs.sendMessage(tab.id, { action: 'startLoading' });
  } catch {
    // Content script not running (e.g., chrome:// pages) — silently bail
    return;
  }

  const selectedText = (captureResult?.text || info.selectionText || '').trim();
  if (!selectedText) return;

  const { apiKey } = await chrome.storage.sync.get('apiKey');

  if (!apiKey) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showError',
      message: 'Add your API key in extension options',
    }).catch(() => {});
    return;
  }

  try {
    const improved = await callClaude(apiKey, contentType.prompt, selectedText, contentType.model);
    chrome.tabs.sendMessage(tab.id, { action: 'replace', text: improved }).catch(() => {});
  } catch (err) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showError',
      message: `Claude failed — ${err.message}`,
    }).catch(() => {});
  }
});
