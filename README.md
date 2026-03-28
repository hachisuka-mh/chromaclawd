# Chromaprompt

A Chrome extension that improves selected text with Claude AI. Right-click any text on any page, choose a writing mode, and Claude rewrites it in place.

---

## What it does

Select text anywhere, right-click, and choose **✦ Improve with Claude**. The extension sends your selection to Claude and replaces it with the improved version — no copy-paste required.

Five built-in writing modes:

| Mode | Best for | Auto-detects |
|---|---|---|
| **Linear Ticket** | Bug reports, feature specs | linear.app |
| **Slack Message** | Team messages | app.slack.com |
| **Email** | Professional emails | Gmail, Outlook |
| **Polish Writing** | General prose | All other sites |
| **AIrbrush** | Remove AI writing tells | Select manually |

---

## Requirements

- Google Chrome (or any Chromium-based browser)
- An [Anthropic API key](https://console.anthropic.com/)

---

## Installation

Chrome does not allow installing extensions from a folder unless you enable Developer Mode. This is a one-time step.

### Step 1 — Enable Developer Mode

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right corner)

You will see a toolbar appear with **Load unpacked**, **Pack extension**, and **Update** buttons.

### Step 2 — Load the extension

1. Click **Load unpacked**
2. Navigate to and select the `chromaclawd` folder
3. The extension appears in your list with the name **Chromaclawd**

> **Tip:** Pin it to your toolbar by clicking the puzzle-piece icon in Chrome's top bar and clicking the pin next to Chromaclawd.

### Step 3 — Add your API key

1. Right-click the extension icon and choose **Options** — or go to `chrome://extensions`, find Chromaclawd, and click **Details → Extension options**
2. Paste your Anthropic API key into the **Anthropic API Key** field
3. Click **Save**

Your API key is stored locally in `chrome.storage.sync` — it is only accessible to this extension and is never sent anywhere except the Anthropic API.

---

## Using the extension

### Basic use

1. Select any text on a page
2. Right-click the selected text
3. Hover over **✦ Improve with Claude**
4. Either:
   - Click the top-level item to use auto-detected mode (based on the current site's URL)
   - Or expand the submenu to pick a specific mode

While Claude is working, a blue **✦ Claude is improving...** pill appears above your selection. When done, your text is replaced in place.

### Choosing a mode manually

The submenu always shows all five modes. Use this to override the auto-detected type — for example, to run AIrbrush on a LinkedIn draft.

### AIrbrush

AIrbrush runs on Claude Opus (the most capable model) and applies a thorough multi-step process to remove AI writing tells:

- Removes em dashes, chatbot phrases, AI vocabulary words
- Consolidates one-sentence-per-paragraph LinkedIn formatting
- Adds sentence rhythm variation and voice

It takes 10–20 seconds. The loading badge will show while it works.

### If replacement fails

On some sites (like LinkedIn's post composer), in-place replacement may not succeed. In that case a toast notification appears:

> Couldn't replace — result copied to clipboard

Paste the result manually with **Cmd+V** / **Ctrl+V**.

---

## Customizing prompts

Go to **Options** to edit the system prompt for any mode, or change which domains trigger auto-detection.

Click **Save All Prompts** to apply changes.

Click **Reset to defaults** to restore all prompts to the originals (this also picks up any new modes added in updates).

---

## Keyboard shortcut

There is no keyboard shortcut by default. You can assign one at `chrome://extensions/shortcuts`.

---

## Privacy

- Your text is sent to the Anthropic API to generate improvements. Anthropic's standard data handling applies.
- Your API key is stored in `chrome.storage.sync` (encrypted, extension-scoped).
- No data is collected by this extension. No analytics, no logging, no third-party services.

---

## Attribution

The **AIrbrush** mode is inspired by the Humanizer skill, a writing de-AI methodology available in various forms across GitHub. Search for "humanizer skill" or "humanizer prompt" on GitHub to find the original and its many adaptations.

---

## Development

### Run tests

```bash
cd chromaclawd
npm install
npm test
```

### Project structure

```
chromaclawd/
├── manifest.json        # MV3 manifest
├── background.js        # Service worker — menus, API calls
├── content.js           # Injected into pages — selection, replacement, UI
├── options.html/.js     # Options page
├── defaults/
│   └── prompts.js       # Default content types and prompts
├── styles/
│   └── content.css      # Badge and toast styles
├── icons/               # Extension icons
└── tests/               # Jest unit tests
```

### Reloading after changes

After editing any file:
1. Go to `chrome://extensions`
2. Click the reload icon (↺) on the Chromaclawd card
3. Refresh any tabs where you want the updated content script

---

## Known limitations

- Chrome only (Manifest V3)
- LinkedIn's post composer and other React-based editors may require manual paste on first use
- AIrbrush is slow by design (Opus model) — expect 10–20 seconds
- Prompts are stored in `chrome.storage.local` and do not sync across devices
