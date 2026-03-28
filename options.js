import { DEFAULT_CONTENT_TYPES } from './defaults/prompts.js';

async function load() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  const { contentTypes } = await chrome.storage.local.get('contentTypes');
  return {
    apiKey: apiKey ?? '',
    contentTypes: contentTypes ?? DEFAULT_CONTENT_TYPES,
  };
}

function renderContentTypes(contentTypes) {
  const container = document.getElementById('contentTypes');
  container.innerHTML = '';

  for (const [key, type] of Object.entries(contentTypes)) {
    const domainsLabel = type.domains.length ? type.domains.join(', ') : 'all other sites (fallback)';

    // Build card structure with static HTML only (no user data in innerHTML)
    const card = document.createElement('div');
    card.className = 'type-card';

    const header = document.createElement('div');
    header.className = 'type-header';
    header.dataset.key = key;

    const headerLeft = document.createElement('div');
    headerLeft.className = 'type-header-left';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'type-name';
    nameSpan.textContent = type.name;

    const domainsSpan = document.createElement('span');
    domainsSpan.className = 'type-domains';
    domainsSpan.textContent = domainsLabel;

    const toggle = document.createElement('span');
    toggle.className = 'type-toggle';
    toggle.textContent = '▼';

    headerLeft.appendChild(nameSpan);
    headerLeft.appendChild(domainsSpan);
    header.appendChild(headerLeft);
    header.appendChild(toggle);

    const body = document.createElement('div');
    body.className = 'type-body';
    body.id = `body-${key}`;

    const domainsLabel2 = document.createElement('label');
    domainsLabel2.textContent = 'Auto-detect domains (comma-separated)';

    const domainsInput = document.createElement('input');
    domainsInput.type = 'text';
    domainsInput.className = 'domains-input';
    domainsInput.dataset.key = key;
    domainsInput.value = type.domains.join(', ');
    domainsInput.placeholder = 'leave empty for fallback';

    const promptLabel = document.createElement('label');
    promptLabel.textContent = 'System prompt sent to Claude';

    const promptTextarea = document.createElement('textarea');
    promptTextarea.className = 'prompt-input';
    promptTextarea.dataset.key = key;
    promptTextarea.rows = 6;
    promptTextarea.value = type.prompt;

    body.appendChild(domainsLabel2);
    body.appendChild(domainsInput);
    body.appendChild(promptLabel);
    body.appendChild(promptTextarea);

    card.appendChild(header);
    card.appendChild(body);

    header.addEventListener('click', () => {
      body.classList.toggle('open');
      toggle.textContent = body.classList.contains('open') ? '▲' : '▼';
    });

    container.appendChild(card);
  }
}

function collectEdits(contentTypes) {
  const updated = {};
  for (const key of Object.keys(contentTypes)) {
    const domainsEl = document.querySelector(`.domains-input[data-key="${key}"]`);
    const promptEl = document.querySelector(`.prompt-input[data-key="${key}"]`);
    updated[key] = {
      ...contentTypes[key],
      domains: domainsEl.value.split(',').map(d => d.trim()).filter(Boolean),
      prompt: promptEl.value.trim(),
    };
  }
  return updated;
}

function showStatus(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 2500);
}

async function init() {
  const { apiKey, contentTypes } = await load();
  document.getElementById('apiKey').value = apiKey;
  renderContentTypes(contentTypes);

  document.getElementById('saveApiKey').addEventListener('click', async () => {
    const key = document.getElementById('apiKey').value.trim();
    await chrome.storage.sync.set({ apiKey: key });
    showStatus('API key saved!');
  });

  document.getElementById('savePrompts').addEventListener('click', async () => {
    const updated = collectEdits(contentTypes);
    await chrome.storage.local.set({ contentTypes: updated });
    showStatus('Prompts saved!');
  });

  document.getElementById('resetPrompts').addEventListener('click', async () => {
    await chrome.storage.local.remove('contentTypes');
    renderContentTypes(DEFAULT_CONTENT_TYPES);
    showStatus('Reset to defaults!');
  });
}

init();
