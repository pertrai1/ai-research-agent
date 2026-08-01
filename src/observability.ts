import { createHash } from 'node:crypto';
import type { LifecycleHooks } from '@cadmusgroup-llc/cg-agent-flow-core';

export type TelemetryKind =
  | 'request'
  | 'agent'
  | 'tool'
  | 'provider'
  | 'guardrail'
  | 'budget'
  | 'timeout'
  | 'validation'
  | 'iteration_exhaustion';

export type TelemetryEvent = {
  kind: TelemetryKind;
  outcome: 'success' | 'failure' | 'started';
  runId?: string;
  clientId?: string;
  sessionId?: string;
  durationMs?: number;
  resultCount?: number;
  tokens?: number;
  cost?: number;
  label?: string;
  [key: string]: unknown;
};

export type SafeTelemetryEvent = {
  kind: TelemetryKind;
  outcome: TelemetryEvent['outcome'];
  runId?: string;
  clientId?: string;
  sessionId?: string;
  durationMs?: number;
  resultCount?: number;
  tokens?: number;
  cost?: number;
  label?: string;
};

export function sanitizeTelemetryEvent(
  event: TelemetryEvent,
): SafeTelemetryEvent {
  const durationMs = numberField(event.durationMs);
  const resultCount = numberField(event.resultCount);
  const tokens = numberField(event.tokens);
  const cost = numberField(event.cost);
  return {
    kind: event.kind,
    outcome: event.outcome,
    ...(event.runId === undefined ? {} : { runId: bounded(event.runId, 80) }),
    ...(event.clientId === undefined
      ? {}
      : { clientId: hashIdentifier(event.clientId) }),
    ...(event.sessionId === undefined
      ? {}
      : { sessionId: hashIdentifier(event.sessionId) }),
    ...(durationMs === undefined ? {} : { durationMs }),
    ...(resultCount === undefined ? {} : { resultCount }),
    ...(tokens === undefined ? {} : { tokens }),
    ...(cost === undefined ? {} : { cost }),
    ...(event.label === undefined ? {} : { label: bounded(event.label, 80) }),
  };
}

export function createTelemetry(sink: (event: SafeTelemetryEvent) => void): {
  emit(event: TelemetryEvent): void;
} {
  return {
    emit(event) {
      sink(sanitizeTelemetryEvent(event));
    },
  };
}

export function createAgentTelemetryHooks(telemetry: {
  emit(event: TelemetryEvent): void;
}): Partial<LifecycleHooks> {
  return {
    beforeRun: (context) => {
      telemetry.emit({
        kind: 'agent',
        outcome: 'started',
        ...contextIdentifiers(context.context),
      });
    },
    afterRun: (context) => {
      telemetry.emit({
        kind: 'agent',
        outcome: context.result.success ? 'success' : 'failure',
        durationMs: context.duration,
        ...(context.result.metadata?.tokensUsed === undefined
          ? {}
          : { tokens: context.result.metadata.tokensUsed }),
        ...contextIdentifiers(undefined),
      });
    },
    onError: (context) => {
      telemetry.emit({
        kind: 'agent',
        outcome: 'failure',
        label: context.phase,
      });
    },
    beforeModelCall: () => {
      telemetry.emit({ kind: 'provider', outcome: 'started' });
    },
    afterModelCall: (context) => {
      telemetry.emit({
        kind: 'provider',
        outcome: 'success',
        durationMs: context.duration,
        tokens: context.response.usage?.totalTokens,
        ...(context.response.cost === undefined
          ? {}
          : { cost: context.response.cost }),
      });
    },
    beforeToolCall: (context) => {
      telemetry.emit({
        kind: 'tool',
        outcome: 'started',
        label: context.toolName,
      });
    },
    afterToolCall: (context) => {
      telemetry.emit({
        kind: 'tool',
        outcome: context.toolResult.success ? 'success' : 'failure',
        durationMs: context.duration,
        label: context.toolName,
      });
    },
  };
}

export type MetricsSnapshot = {
  requests: number;
  successes: number;
  failures: number;
  toolFailures: number;
  providerFailures: number;
  iterationExhaustions: number;
  totalDurationMs: number;
  totalTokens: number;
  estimatedCost: number;
};

export function createMetrics(): {
  record(event: TelemetryEvent): void;
  snapshot(): MetricsSnapshot;
} {
  const totals: MetricsSnapshot = {
    requests: 0,
    successes: 0,
    failures: 0,
    toolFailures: 0,
    providerFailures: 0,
    iterationExhaustions: 0,
    totalDurationMs: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };
  return {
    record(event) {
      const safe = sanitizeTelemetryEvent(event);
      if (safe.kind === 'request') {
        totals.requests += 1;
        if (safe.outcome === 'success') totals.successes += 1;
        if (safe.outcome === 'failure') totals.failures += 1;
      }
      if (safe.kind === 'tool' && safe.outcome === 'failure')
        totals.toolFailures += 1;
      if (safe.kind === 'provider' && safe.outcome === 'failure')
        totals.providerFailures += 1;
      if (safe.kind === 'iteration_exhaustion')
        totals.iterationExhaustions += 1;
      totals.totalDurationMs += safe.durationMs ?? 0;
      totals.totalTokens += safe.tokens ?? 0;
      totals.estimatedCost += safe.cost ?? 0;
    },
    snapshot() {
      return { ...totals };
    },
  };
}

function hashIdentifier(value: string): string {
  return `id_${createHash('sha256').update(value).digest('hex').slice(0, 16)}`;
}

function bounded(value: string, max: number): string {
  return value.slice(0, max);
}

function numberField(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? Math.min(value, 1_000_000_000)
    : undefined;
}

function contextIdentifiers(context: Record<string, unknown> | undefined): {
  runId?: string;
  clientId?: string;
  sessionId?: string;
} {
  const value = (key: string): string | undefined =>
    typeof context?.[key] === 'string' ? context[key] : undefined;
  const runId = value('runId');
  const clientId = value('clientId');
  const sessionId = value('sessionId');
  return {
    ...(runId === undefined ? {} : { runId }),
    ...(clientId === undefined ? {} : { clientId }),
    ...(sessionId === undefined ? {} : { sessionId }),
  };
}
