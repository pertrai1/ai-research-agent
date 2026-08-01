import { createHash, timingSafeEqual } from 'node:crypto';

import type { ErrorCategory } from './errors.js';

export type AuthenticationResult =
  | { ok: true; clientId: string }
  | { ok: false; error: { code: 'AUTHENTICATION_FAILED' } };

export type ApiKeyAuthenticator = {
  authenticate(authorization: string | undefined): AuthenticationResult;
};

export function createApiKeyAuthenticator(
  apiKey?: string,
): ApiKeyAuthenticator {
  const expected = Buffer.from(apiKey ?? '', 'utf8');
  const clientId = `client_${createHash('sha256').update(expected).digest('hex').slice(0, 16)}`;

  return {
    authenticate(authorization) {
      if (!apiKey || !authorization?.startsWith('Bearer ')) {
        return authenticationFailure();
      }
      const supplied = Buffer.from(
        authorization.slice('Bearer '.length),
        'utf8',
      );
      if (
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      ) {
        return authenticationFailure();
      }
      return { ok: true, clientId };
    },
  };
}

export type RateLimiter = { allow(clientId: string): boolean };

export function createRateLimiter({
  maxRequests,
  windowMs,
  now = Date.now,
}: {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const requests = new Map<string, number[]>();
  const limit = Math.max(1, Math.floor(maxRequests));
  const window = Math.max(1, Math.floor(windowMs));

  return {
    allow(clientId) {
      const cutoff = now() - window;
      const active = (requests.get(clientId) ?? []).filter(
        (time) => time > cutoff,
      );
      if (active.length >= limit) {
        requests.set(clientId, active);
        return false;
      }
      active.push(now());
      requests.set(clientId, active);
      return true;
    },
  };
}

export type ConcurrencyLimiter = {
  tryAcquire(): boolean;
  release(): void;
};

export function createConcurrencyLimiter(
  maxConcurrent: number,
): ConcurrencyLimiter {
  const limit = Math.max(1, Math.floor(maxConcurrent));
  let active = 0;
  return {
    tryAcquire() {
      if (active >= limit) return false;
      active += 1;
      return true;
    },
    release() {
      active = Math.max(0, active - 1);
    },
  };
}

export function authenticationFailure(): AuthenticationResult {
  return { ok: false, error: { code: 'AUTHENTICATION_FAILED' } };
}

export function isControlError(
  value: unknown,
): value is { category: ErrorCategory } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'category' in value &&
    typeof value.category === 'string' &&
    [
      'AUTHENTICATION_FAILED',
      'RATE_LIMITED',
      'SERVICE_BUSY',
      'TIMEOUT',
    ].includes(value.category)
  );
}
