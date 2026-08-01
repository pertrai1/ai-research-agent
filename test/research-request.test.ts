import { describe, expect, it } from 'vitest';

import { parseResearchRequest } from '../src/contracts.js';

describe('parseResearchRequest', () => {
  it('trims a valid topic and generates a session ID when one is absent', () => {
    expect(
      parseResearchRequest(
        { topic: '  recent battery recycling research  ' },
        () => 'generated-session-id',
      ),
    ).toEqual({
      ok: true,
      value: {
        topic: 'recent battery recycling research',
        sessionId: 'generated-session-id',
      },
    });
  });

  it('rejects empty, oversized, malformed, and unsupported request bodies', () => {
    expect(parseResearchRequest({ topic: '   ' }, () => 'unused')).toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(
      parseResearchRequest({ topic: 'a'.repeat(301) }, () => 'unused'),
    ).toEqual({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(
      parseResearchRequest(
        { sessionId: 'session-1', topic: 'valid topic' },
        () => 'unused',
      ),
    ).toEqual({
      ok: true,
      value: { sessionId: 'session-1', topic: 'valid topic' },
    });
    expect(
      parseResearchRequest(
        { topic: 'valid topic', extra: true },
        () => 'unused',
      ),
    ).toEqual({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });
});
