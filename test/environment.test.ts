import { describe, expect, it } from 'vitest';

import { loadEnvironment } from '../src/environment.js';

describe('loadEnvironment', () => {
  it('uses local defaults without provider credentials', () => {
    expect(loadEnvironment({ NODE_ENV: 'development' })).toEqual({
      ok: true,
      value: { environment: 'development', port: 3000 },
    });
  });

  it('requires both provider credentials in production', () => {
    expect(loadEnvironment({ NODE_ENV: 'production' })).toEqual({
      ok: false,
      error: {
        code: 'INVALID_ENVIRONMENT',
        fields: ['ANTHROPIC_API_KEY', 'TAVILY_API_KEY'],
      },
    });
  });

  it('rejects a blank production provider credential', () => {
    expect(
      loadEnvironment({
        ANTHROPIC_API_KEY: '   ',
        NODE_ENV: 'production',
        TAVILY_API_KEY: 'tavily-secret-value',
      }),
    ).toEqual({
      ok: false,
      error: { code: 'INVALID_ENVIRONMENT', fields: ['ANTHROPIC_API_KEY'] },
    });
  });

  it('rejects an invalid port without exposing supplied secret values', () => {
    const result = loadEnvironment({
      ANTHROPIC_API_KEY: 'anthropic-secret-value',
      TAVILY_API_KEY: 'tavily-secret-value',
      NODE_ENV: 'production',
      PORT: 'not-a-number',
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'INVALID_ENVIRONMENT', fields: ['PORT'] },
    });
    expect(JSON.stringify(result)).not.toContain('anthropic-secret-value');
    expect(JSON.stringify(result)).not.toContain('tavily-secret-value');
  });
});
