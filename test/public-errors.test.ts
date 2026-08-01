import { describe, expect, it } from 'vitest';

import {
  createApplicationError,
  errorCategories,
  toPublicError,
} from '../src/errors.js';

describe('toPublicError', () => {
  it('maps a typed provider failure to its stable public HTTP response', () => {
    expect(
      toPublicError(createApplicationError('SEARCH_PROVIDER_FAILURE')),
    ).toEqual({
      body: {
        error: {
          code: 'SEARCH_PROVIDER_FAILURE',
          message: 'The search provider could not complete the request.',
        },
      },
      status: 502,
    });
  });

  it('maps every defined category and omits sensitive internal context', () => {
    const statuses = {
      INVALID_REQUEST: 400,
      AUTHENTICATION_FAILED: 401,
      RATE_LIMITED: 429,
      SERVICE_BUSY: 503,
      TIMEOUT: 503,
      SEARCH_PROVIDER_FAILURE: 502,
      PAGE_RETRIEVAL_REJECTED: 400,
      PAGE_RETRIEVAL_FAILURE: 502,
      LLM_PROVIDER_FAILURE: 502,
      BUDGET_EXHAUSTED: 429,
      ITERATION_LIMIT_EXHAUSTED: 503,
      INVALID_AGENT_OUTPUT: 502,
      INTERNAL_ERROR: 500,
    } as const;

    for (const category of errorCategories) {
      expect(toPublicError(createApplicationError(category)).status).toBe(
        statuses[category],
      );
    }

    const publicError = toPublicError(
      createApplicationError('INTERNAL_ERROR', {
        providerMessage: 'tavily-secret-value',
        stack: 'Error: failed at /private/service/src/client.ts:1',
      }),
    );

    expect(publicError).toEqual({
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'The service could not complete the request.',
        },
      },
      status: 500,
    });
    expect(JSON.stringify(publicError)).not.toContain('tavily-secret-value');
    expect(JSON.stringify(publicError)).not.toContain('/private/service');
  });
});
