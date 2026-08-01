import {
  createTracer,
  createTracingHooks,
  SimpleSpanProcessor,
  type Exporter,
  type ReadonlySpan,
  type SpanAttributeValue,
} from '@cadmusgroup-llc/cg-agent-flow-observability';

const ALLOWED_ATTRIBUTES = new Set([
  'run.id',
  'agent.name',
  'tool.name',
  'span.kind',
]);
const MAX_STRING_LENGTH = 80;
const MAX_DURATION_MS = 120_000;

export type SanitizedSpanSummary = {
  name: string;
  traceId: string;
  spanId: string;
  status: ReadonlySpan['status'];
  durationMs: number;
  attributes: Record<string, SpanAttributeValue>;
};

export class SanitizedSpanExporter implements Exporter {
  private readonly spans: SanitizedSpanSummary[] = [];

  constructor(private readonly sink?: (span: SanitizedSpanSummary) => void) {}

  export(spanBatch: ReadonlySpan[]): void {
    for (const span of spanBatch) {
      const summary: SanitizedSpanSummary = {
        name: bounded(span.name),
        traceId: bounded(span.context.traceId),
        spanId: bounded(span.context.spanId),
        status: span.status,
        durationMs: boundedNumber(
          (span.endTime ?? span.startTime) - span.startTime,
        ),
        attributes: {},
      };
      for (const [key, value] of Object.entries(span.attributes)) {
        if (!ALLOWED_ATTRIBUTES.has(key)) continue;
        summary.attributes[key] = sanitizeAttribute(value);
      }
      this.spans.push(summary);
      this.sink?.(summary);
    }
  }

  async shutdown(): Promise<void> {}

  getSpans(): readonly SanitizedSpanSummary[] {
    return this.spans;
  }
}

export function createShowcaseTracingProfile(
  sink?: (span: SanitizedSpanSummary) => void,
): {
  enabled: true;
  tracer: ReturnType<typeof createTracer>;
  hooks: ReturnType<typeof createTracingHooks>;
  exporter: SanitizedSpanExporter;
} {
  const exporter = new SanitizedSpanExporter(sink);
  const tracer = createTracer({
    processor: new SimpleSpanProcessor(exporter),
    serviceName: 'ai-research-agent-showcase',
  });
  return {
    enabled: true,
    tracer,
    exporter,
    hooks: createTracingHooks({ tracer }),
  };
}

function bounded(value: string): string {
  return value.slice(0, MAX_STRING_LENGTH);
}

function boundedNumber(value: number): number {
  return Math.max(0, Math.min(Math.round(value), MAX_DURATION_MS));
}

function sanitizeAttribute(value: SpanAttributeValue): SpanAttributeValue {
  return typeof value === 'string' ? bounded(value) : value;
}
