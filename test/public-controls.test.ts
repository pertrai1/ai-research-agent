import { describe, expect, it } from 'vitest';

import {
  createApiKeyAuthenticator,
  createConcurrencyLimiter,
  createRateLimiter,
} from '../src/public-controls.js';

describe('public API controls', () => {
  it('authenticates only the configured API key and derives a stable client ID', () => {
    const authenticator = createApiKeyAuthenticator('test-secret');

    expect(authenticator.authenticate('Bearer test-secret')).toEqual({
      ok: true,
      clientId: expect.stringMatching(/^client_[a-f0-9]{16}$/),
    });
    expect(authenticator.authenticate('Bearer wrong')).toEqual({
      ok: false,
      error: { code: 'AUTHENTICATION_FAILED' },
    });
    expect(authenticator.authenticate(undefined)).toEqual({
      ok: false,
      error: { code: 'AUTHENTICATION_FAILED' },
    });
  });

  it('limits a client to the configured rate window', () => {
    let now = 1_000;
    const limiter = createRateLimiter({
      maxRequests: 2,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.allow('client-a')).toBe(true);
    expect(limiter.allow('client-a')).toBe(true);
    expect(limiter.allow('client-a')).toBe(false);
    now += 1_001;
    expect(limiter.allow('client-a')).toBe(true);
  });

  it('rejects a third active request until one permit is released', () => {
    const limiter = createConcurrencyLimiter(2);

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    limiter.release();
    expect(limiter.tryAcquire()).toBe(true);
  });
});
