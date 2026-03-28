import { detectContentType, callClaude } from '../background.js';
import { DEFAULT_CONTENT_TYPES, FALLBACK_TYPE_KEY } from '../defaults/prompts.js';

describe('detectContentType', () => {
  test('detects linear.app', () => {
    expect(
      detectContentType('https://linear.app/team/issue/EXC-123', DEFAULT_CONTENT_TYPES)
    ).toBe('linear');
  });

  test('detects app.slack.com', () => {
    expect(
      detectContentType('https://app.slack.com/client/T123/C456', DEFAULT_CONTENT_TYPES)
    ).toBe('slack');
  });

  test('detects mail.google.com', () => {
    expect(
      detectContentType('https://mail.google.com/mail/u/0/#inbox', DEFAULT_CONTENT_TYPES)
    ).toBe('email');
  });

  test('detects outlook.live.com', () => {
    expect(
      detectContentType('https://outlook.live.com/mail/0/inbox', DEFAULT_CONTENT_TYPES)
    ).toBe('email');
  });

  test('falls back to general for unknown domain', () => {
    expect(
      detectContentType('https://github.com/org/repo/pulls', DEFAULT_CONTENT_TYPES)
    ).toBe(FALLBACK_TYPE_KEY);
  });

  test('falls back to general for invalid URL', () => {
    expect(
      detectContentType('not-a-url', DEFAULT_CONTENT_TYPES)
    ).toBe(FALLBACK_TYPE_KEY);
  });

  test('falls back to general for empty string', () => {
    expect(
      detectContentType('', DEFAULT_CONTENT_TYPES)
    ).toBe(FALLBACK_TYPE_KEY);
  });

  test('detects subdomains (e.g. team.linear.app)', () => {
    expect(
      detectContentType('https://team.linear.app/issue/EXC-1', DEFAULT_CONTENT_TYPES)
    ).toBe('linear');
  });
});

describe('callClaude', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns improved text from a successful response', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ content: [{ text: 'Improved ticket content.' }] }),
    });

    const result = await callClaude('sk-ant-test', 'Improve this.', 'original text');
    expect(result).toBe('Improved ticket content.');
  });

  test('sends correct headers and body to Claude API', async () => {
    let capturedRequest;
    global.fetch = async (url, opts) => {
      capturedRequest = { url, ...opts, body: JSON.parse(opts.body) };
      return {
        ok: true,
        json: async () => ({ content: [{ text: 'ok' }] }),
      };
    };

    await callClaude('sk-ant-mykey', 'system prompt here', 'user text here');

    expect(capturedRequest.url).toBe('https://api.anthropic.com/v1/messages');
    expect(capturedRequest.headers['x-api-key']).toBe('sk-ant-mykey');
    expect(capturedRequest.headers['anthropic-version']).toBe('2023-06-01');
    expect(capturedRequest.body.model).toBe('claude-haiku-4-5-20251001');
    expect(capturedRequest.body.system).toBe('system prompt here');
    expect(capturedRequest.body.messages[0].content).toBe('user text here');
    expect(capturedRequest.body.max_tokens).toBe(2048);
  });

  test('throws with API error message on non-OK response', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    await expect(callClaude('bad-key', 'prompt', 'text')).rejects.toThrow('Invalid API key');
  });

  test('throws generic message when error body has no message field', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(callClaude('key', 'prompt', 'text')).rejects.toThrow('API error 500');
  });

  test('propagates network errors', async () => {
    global.fetch = async () => { throw new Error('Network failure'); };
    await expect(callClaude('key', 'prompt', 'text')).rejects.toThrow('Network failure');
  });
});
