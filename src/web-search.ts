import {
  MAX_SEARCH_RESULTS,
  parseSearchInput,
  parseTavilySearchResponse,
  type SearchInput,
  type SearchResults,
} from './contracts.js';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 100;
const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_SERVER_ERROR = 500;

export type SearchTelemetryEvent = {
  durationMs: number;
  outcome: 'success' | 'failure';
  resultCount: number;
};

export type TavilyTransport = {
  search(
    input: SearchInput,
    signal?: AbortSignal,
  ): Promise<TavilyTransportResult>;
};

type TavilyTransportResult =
  | { ok: true; value: unknown }
  | { ok: false; error: { code: 'SEARCH_PROVIDER_FAILURE' } };

type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;
type TimeoutScheduler = (
  callback: () => void,
  delayMs: number,
) => { cancel(): void };

type TavilyTransportOptions = {
  apiKey: string;
  fetch?: FetchFunction;
  maxAttempts?: number;
  scheduleTimeout?: TimeoutScheduler;
  sleep?: (delayMs: number) => Promise<void>;
  timeoutMs?: number;
};

type WebSearchToolOptions = {
  now?: () => number;
  onTelemetry?: (event: SearchTelemetryEvent) => void;
  transport: TavilyTransport;
};

export type WebSearchTool = {
  name: 'web_search';
  execute(input: unknown, signal?: AbortSignal): Promise<WebSearchResult>;
};

export type WebSearchResult =
  | { ok: true; value: SearchResults }
  | {
      ok: false;
      error: { code: 'INVALID_REQUEST' | 'SEARCH_PROVIDER_FAILURE' };
    };

export function createTavilyTransport({
  apiKey,
  fetch = globalThis.fetch,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  scheduleTimeout = defaultScheduleTimeout,
  sleep = defaultSleep,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: TavilyTransportOptions): TavilyTransport {
  const attempts = Math.max(1, Math.floor(maxAttempts));
  const perAttemptTimeout = Math.max(1, Math.floor(timeoutMs));

  return {
    async search(input, signal): Promise<TavilyTransportResult> {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const response = await fetchAttempt({
          apiKey,
          fetch,
          input,
          scheduleTimeout,
          timeoutMs: perAttemptTimeout,
          ...(signal === undefined ? {} : { callerSignal: signal }),
        });

        if (response.ok) {
          return response;
        }

        if (!response.retryable || attempt === attempts - 1) {
          return providerFailure();
        }

        await sleep(INITIAL_RETRY_DELAY_MS * 2 ** attempt);
      }

      return providerFailure();
    },
  };
}

export function createWebSearchTool({
  now = Date.now,
  onTelemetry,
  transport,
}: WebSearchToolOptions): WebSearchTool {
  return {
    name: 'web_search',
    execute: (input, signal) =>
      executeWebSearch({
        input,
        now,
        onTelemetry,
        transport,
        ...(signal === undefined ? {} : { signal }),
      }),
  };
}

async function executeWebSearch({
  input,
  now,
  onTelemetry,
  transport,
  signal,
}: {
  input: unknown;
  now: () => number;
  onTelemetry: ((event: SearchTelemetryEvent) => void) | undefined;
  transport: TavilyTransport;
  signal?: AbortSignal;
}): Promise<WebSearchResult> {
  const startedAt = now();
  const parsedInput = parseSearchInput(input);

  if (!parsedInput.ok) {
    emitFailureTelemetry({ onTelemetry, now, startedAt });
    return parsedInput;
  }

  try {
    const providerResult = await transport.search(parsedInput.value, signal);
    if (!providerResult.ok) {
      emitFailureTelemetry({ onTelemetry, now, startedAt });
      return providerResult;
    }

    const parsedResponse = parseTavilySearchResponse(providerResult.value);
    if (!parsedResponse.ok) {
      emitFailureTelemetry({ onTelemetry, now, startedAt });
      return providerFailure();
    }

    emitTelemetry({
      onTelemetry,
      durationMs: now() - startedAt,
      outcome: 'success',
      resultCount: parsedResponse.value.results.length,
    });
    return parsedResponse;
  } catch {
    emitFailureTelemetry({ onTelemetry, now, startedAt });
    return providerFailure();
  }
}

async function fetchAttempt({
  apiKey,
  fetch,
  input,
  scheduleTimeout,
  timeoutMs,
  callerSignal,
}: {
  apiKey: string;
  fetch: FetchFunction;
  input: SearchInput;
  scheduleTimeout: TimeoutScheduler;
  timeoutMs: number;
  callerSignal?: AbortSignal;
}): Promise<TavilyTransportResult & { retryable?: boolean }> {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  callerSignal?.addEventListener('abort', abort, { once: true });
  const timeout = scheduleTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: input.query,
        max_results: MAX_SEARCH_RESULTS,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ...providerFailure(),
        retryable: isRetryableStatus(response.status),
      };
    }

    try {
      return { ok: true, value: await response.json() };
    } catch {
      return providerFailure();
    }
  } catch {
    return { ...providerFailure(), retryable: true };
  } finally {
    timeout.cancel();
    callerSignal?.removeEventListener('abort', abort);
  }
}

function emitTelemetry({
  onTelemetry,
  durationMs,
  outcome,
  resultCount,
}: {
  onTelemetry: ((event: SearchTelemetryEvent) => void) | undefined;
  durationMs: number;
  outcome: SearchTelemetryEvent['outcome'];
  resultCount: number;
}): void {
  onTelemetry?.({ durationMs, outcome, resultCount });
}

function emitFailureTelemetry({
  onTelemetry,
  now,
  startedAt,
}: {
  onTelemetry: ((event: SearchTelemetryEvent) => void) | undefined;
  now: () => number;
  startedAt: number;
}): void {
  emitTelemetry({
    onTelemetry,
    durationMs: now() - startedAt,
    outcome: 'failure',
    resultCount: 0,
  });
}

function isRetryableStatus(status: number): boolean {
  return (
    status === HTTP_REQUEST_TIMEOUT ||
    status === HTTP_TOO_MANY_REQUESTS ||
    status >= HTTP_INTERNAL_SERVER_ERROR
  );
}

function providerFailure(): {
  ok: false;
  error: { code: 'SEARCH_PROVIDER_FAILURE' };
} {
  return { ok: false, error: { code: 'SEARCH_PROVIDER_FAILURE' } };
}

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function defaultScheduleTimeout(
  callback: () => void,
  delayMs: number,
): { cancel(): void } {
  const timeout = setTimeout(callback, delayMs);
  return { cancel: () => clearTimeout(timeout) };
}
