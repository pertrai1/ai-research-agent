import { describe, expect, it } from 'vitest';

import {
  createMetrics,
  createTelemetry,
  sanitizeTelemetryEvent,
} from '../src/observability.js';

describe('privacy-safe observability', () => {
  it('keeps correlation and bounded operational fields while dropping sensitive fields', () => {
    const event = sanitizeTelemetryEvent({
      kind: 'provider',
      outcome: 'failure',
      runId: 'run-123',
      clientId: 'client-secret',
      sessionId: 'session-secret',
      durationMs: 12,
      prompt: 'private prompt',
      page: 'private page',
      authorization: 'Bearer api-secret',
      error: '/private/path provider body',
    });

    expect(event).toMatchObject({
      kind: 'provider',
      outcome: 'failure',
      runId: 'run-123',
      durationMs: 12,
      clientId: expect.stringMatching(/^id_[a-f0-9]{16}$/),
      sessionId: expect.stringMatching(/^id_[a-f0-9]{16}$/),
    });
    expect(JSON.stringify(event)).not.toContain('private prompt');
    expect(JSON.stringify(event)).not.toContain('api-secret');
    expect(JSON.stringify(event)).not.toContain('/private/path');
  });

  it('records required aggregate metrics without retaining content', () => {
    const metrics = createMetrics();
    metrics.record({ kind: 'request', outcome: 'success', durationMs: 10 });
    metrics.record({ kind: 'request', outcome: 'failure', durationMs: 1 });
    metrics.record({ kind: 'tool', outcome: 'failure', durationMs: 3 });
    metrics.record({
      kind: 'budget',
      outcome: 'failure',
      cost: 0.25,
      tokens: 4,
    });

    expect(metrics.snapshot()).toEqual({
      requests: 2,
      successes: 1,
      failures: 1,
      toolFailures: 1,
      providerFailures: 0,
      iterationExhaustions: 0,
      totalDurationMs: 14,
      totalTokens: 4,
      estimatedCost: 0.25,
    });
  });

  it('emits sanitized events to the configured sink', () => {
    const events: unknown[] = [];
    const telemetry = createTelemetry((event) => events.push(event));
    telemetry.emit({ kind: 'validation', outcome: 'failure', error: 'secret' });

    expect(events).toHaveLength(1);
    const event = events.at(0);
    expect(JSON.stringify(event)).not.toContain('secret');
  });
});
