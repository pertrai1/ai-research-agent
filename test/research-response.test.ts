import { describe, expect, it } from 'vitest';

import { parseResearchResponse } from '../src/contracts.js';

describe('parseResearchResponse', () => {
  it('accepts a complete structured response with a 500-word brief', () => {
    expect(
      parseResearchResponse({
        brief: Array.from({ length: 500 }, () => 'word').join(' '),
        runId: 'run-123',
        sessionId: 'session-123',
        sources: [
          {
            title: 'Primary source',
            url: 'https://example.com/research',
          },
        ],
        topic: 'battery recycling',
        uncertainty: 'The sources do not report long-term outcomes.',
      }),
    ).toEqual({
      ok: true,
      value: {
        brief: Array.from({ length: 500 }, () => 'word').join(' '),
        runId: 'run-123',
        sessionId: 'session-123',
        sources: [
          { title: 'Primary source', url: 'https://example.com/research' },
        ],
        topic: 'battery recycling',
        uncertainty: 'The sources do not report long-term outcomes.',
      },
    });
  });

  it('returns a typed failure for malformed or oversized model output', () => {
    const secret = 'anthropic-secret-value';
    const result = parseResearchResponse({
      brief: Array.from({ length: 501 }, () => 'word').join(' '),
      runId: 'run-123',
      sessionId: 'session-123',
      sources: [{ title: 'Source', url: 'https://example.com/source' }],
      topic: 'battery recycling',
      uncertainty: secret,
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'INVALID_AGENT_OUTPUT' },
    });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(parseResearchResponse(null)).toEqual({
      ok: false,
      error: { code: 'INVALID_AGENT_OUTPUT' },
    });
  });
});
