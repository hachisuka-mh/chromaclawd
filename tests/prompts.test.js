import { DEFAULT_CONTENT_TYPES, FALLBACK_TYPE_KEY } from '../defaults/prompts.js';

describe('DEFAULT_CONTENT_TYPES', () => {
  test('has all four required keys', () => {
    expect(Object.keys(DEFAULT_CONTENT_TYPES)).toEqual(
      expect.arrayContaining(['linear', 'slack', 'email', 'general'])
    );
  });

  test('each type has name, domains array, and non-empty prompt', () => {
    for (const [key, type] of Object.entries(DEFAULT_CONTENT_TYPES)) {
      expect(typeof type.name).toBe('string');
      expect(Array.isArray(type.domains)).toBe(true);
      expect(type.prompt.length).toBeGreaterThan(20);
    }
  });

  test('linear type includes linear.app domain', () => {
    expect(DEFAULT_CONTENT_TYPES.linear.domains).toContain('linear.app');
  });

  test('slack type includes app.slack.com domain', () => {
    expect(DEFAULT_CONTENT_TYPES.slack.domains).toContain('app.slack.com');
  });

  test('email type includes mail.google.com domain', () => {
    expect(DEFAULT_CONTENT_TYPES.email.domains).toContain('mail.google.com');
  });

  test('general (fallback) type has empty domains array', () => {
    expect(DEFAULT_CONTENT_TYPES.general.domains).toHaveLength(0);
  });

  test('FALLBACK_TYPE_KEY is "general"', () => {
    expect(FALLBACK_TYPE_KEY).toBe('general');
  });

  test('email type includes outlook.live.com and outlook.office.com domains', () => {
    expect(DEFAULT_CONTENT_TYPES.email.domains).toContain('outlook.live.com');
    expect(DEFAULT_CONTENT_TYPES.email.domains).toContain('outlook.office.com');
  });

  test('has exactly five content types', () => {
    expect(Object.keys(DEFAULT_CONTENT_TYPES)).toHaveLength(5);
  });

  test('airbrush type has empty domains and uses claude-opus-4-6', () => {
    expect(DEFAULT_CONTENT_TYPES.airbrush.domains).toHaveLength(0);
    expect(DEFAULT_CONTENT_TYPES.airbrush.model).toBe('claude-opus-4-6');
  });
});
