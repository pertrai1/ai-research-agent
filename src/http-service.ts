import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

import { createMemoryHooks } from '@cadmusgroup-llc/cg-agent-flow-memory';

import {
  parseResearchRequest,
  type ResearchRequest,
  type ResearchResponse,
} from './contracts.js';
import {
  createApplicationError,
  errorCategories,
  toPublicError,
  type ErrorCategory,
} from './errors.js';
import { createConversationMemory, LocalMemoryStore } from './memory.js';
import {
  createApiKeyAuthenticator,
  createConcurrencyLimiter,
  createRateLimiter,
  type ApiKeyAuthenticator,
  type ConcurrencyLimiter,
  type RateLimiter,
} from './public-controls.js';
import {
  createAgentTelemetryHooks,
  createTelemetry,
  type TelemetryEvent,
} from './observability.js';
import {
  runResearchAgent,
  type ResearchAgentDependencies,
} from './research-agent.js';
import { writeJson } from './write-json.js';

const DEFAULT_MAX_BODY_BYTES = 1_000_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_SERVICE_UNAVAILABLE = 503;
const applicationErrorCategories = new Set<string>(errorCategories);

export type ResearchExecutionResult =
  | { ok: true; value: ResearchResponse }
  | { ok: false; error: { code: ErrorCategory } };

export type ResearchExecutionContext = {
  signal: AbortSignal;
  clientId?: string;
  runId: string;
};

export type ResearchExecutor = (
  request: ResearchRequest,
  context?: ResearchExecutionContext,
) => Promise<ResearchExecutionResult>;

export type ResearchHttpServerOptions = {
  executor: ResearchExecutor;
  ready?: () => boolean;
  generateSessionId?: () => string;
  maxBodyBytes?: number;
  apiKey?: string;
  rateLimit?: { maxRequests: number; windowMs: number; now?: () => number };
  maxConcurrent?: number;
  requestTimeoutMs?: number;
  corsOrigins?: string[];
  telemetry?: { emit(event: TelemetryEvent): void };
  metrics?: { record(event: TelemetryEvent): void };
};

type ServerState = {
  accepting: boolean;
  active: number;
  drained?: () => void;
  authenticator: ApiKeyAuthenticator;
  rateLimiter: RateLimiter;
  concurrencyLimiter: ConcurrencyLimiter;
  authEnabled: boolean;
};

const serverStates = new WeakMap<Server, ServerState>();

export function createResearchExecutor(
  dependencies: ResearchAgentDependencies,
  telemetry?: { emit(event: TelemetryEvent): void },
): ResearchExecutor {
  const memory = createConversationMemory(new LocalMemoryStore());
  const hooks = {
    ...createMemoryHooks(memory),
    ...(telemetry === undefined ? {} : createAgentTelemetryHooks(telemetry)),
  };

  return async ({ topic, sessionId }, context) => {
    const result = await runResearchAgent({
      dependencies,
      topic,
      sessionId,
      hooks,
      ...(context?.signal === undefined ? {} : { signal: context.signal }),
    });
    return result.ok ? { ok: true, value: result.value } : result;
  };
}

export function createResearchHttpServer({
  executor,
  ready = () => true,
  generateSessionId = randomUUID,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  apiKey,
  rateLimit = { maxRequests: 60, windowMs: 60_000 },
  maxConcurrent = 8,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  corsOrigins = [],
  telemetry = createTelemetry(() => undefined),
  metrics = { record: () => undefined },
}: ResearchHttpServerOptions): Server {
  const state: ServerState = {
    accepting: true,
    active: 0,
    authenticator: createApiKeyAuthenticator(apiKey),
    rateLimiter: createRateLimiter(rateLimit),
    concurrencyLimiter: createConcurrencyLimiter(maxConcurrent),
    authEnabled: apiKey !== undefined,
  };
  const server = createServer((request, response) => {
    const current = serverStates.get(server);
    const headers = responseHeaders(request, corsOrigins);
    if (!current || !current.accepting) {
      writeJson({
        response,
        status: HTTP_SERVICE_UNAVAILABLE,
        body: {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'The service is shutting down.',
          },
        },
        headers,
      });
      return;
    }

    current.active += 1;
    void handleRequest({
      request,
      response,
      options: {
        executor,
        ready,
        generateSessionId,
        maxBodyBytes,
        apiKey: apiKey ?? '',
        rateLimit,
        maxConcurrent,
        requestTimeoutMs,
        corsOrigins,
        telemetry,
        metrics,
      },
      state: current,
      headers,
    })
      .catch(() =>
        writeJson({
          response,
          status: HTTP_INTERNAL_SERVER_ERROR,
          body: toPublicError(createApplicationError('INTERNAL_ERROR')).body,
          headers,
        }),
      )
      .finally(() => {
        current.active -= 1;
        if (current.active === 0) current.drained?.();
      });
  });
  serverStates.set(server, state);
  return server;
}

export async function shutdownResearchHttpServer(
  server: Server,
): Promise<void> {
  const state = serverStates.get(server);
  if (state) state.accepting = false;
  const drained =
    state && state.active > 0
      ? new Promise<void>((resolve) => {
          state.drained = resolve;
        })
      : Promise.resolve();
  if (server.listening) {
    server.close();
    server.closeIdleConnections();
  }
  await drained;
}

async function handleRequest({
  request,
  response,
  options,
  state,
  headers,
}: {
  request: IncomingMessage;
  response: ServerResponse;
  options: Required<ResearchHttpServerOptions>;
  state: ServerState;
  headers: Record<string, string>;
}): Promise<void> {
  try {
    if (isRoute({ request, method: 'GET', path: '/health' })) {
      writeJson({ response, status: HTTP_OK, body: { status: 'ok' }, headers });
      return;
    }

    const protectedRoute =
      isRoute({ request, method: 'GET', path: '/ready' }) ||
      isRoute({ request, method: 'POST', path: '/research' });
    if (state.authEnabled && protectedRoute) {
      const auth = state.authenticator.authenticate(
        request.headers.authorization,
      );
      if (!auth.ok) {
        writeApplicationError(response, auth.error.code, headers);
        return;
      }
      if (isRoute({ request, method: 'POST', path: '/research' })) {
        if (!state.rateLimiter.allow(auth.clientId)) {
          writeApplicationError(response, 'RATE_LIMITED', headers);
          return;
        }
        if (!state.concurrencyLimiter.tryAcquire()) {
          writeApplicationError(response, 'SERVICE_BUSY', headers);
          return;
        }
        try {
          await handleResearchRequest({
            request,
            response,
            options,
            headers,
            clientId: auth.clientId,
          });
        } finally {
          state.concurrencyLimiter.release();
        }
        return;
      }
    }

    if (isRoute({ request, method: 'GET', path: '/ready' })) {
      writeJson({
        response,
        status: options.ready() ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE,
        body: { status: options.ready() ? 'ready' : 'not_ready' },
        headers,
      });
      return;
    }
    if (!isRoute({ request, method: 'POST', path: '/research' })) {
      writeJson({
        response,
        status: HTTP_NOT_FOUND,
        body: {
          error: {
            code: 'INVALID_REQUEST',
            message: 'The request is invalid.',
          },
        },
        headers,
      });
      return;
    }
    await handleResearchRequest({ request, response, options, headers });
  } catch (error) {
    writeApplicationError(response, errorCategory(error), headers);
  }
}

async function handleResearchRequest({
  request,
  response,
  options,
  headers,
  clientId,
}: {
  request: IncomingMessage;
  response: ServerResponse;
  options: Required<ResearchHttpServerOptions>;
  headers: Record<string, string>;
  clientId?: string;
}): Promise<void> {
  const body = await readJsonBody(request, options.maxBodyBytes);
  const parsed = parseResearchRequest(body, options.generateSessionId);
  if (!parsed.ok) {
    writeApplicationError(response, parsed.error.code, headers);
    return;
  }

  const controller = new AbortController();
  const cancel = (): void => controller.abort();
  request.once('aborted', cancel);
  request.once('close', cancel);
  const timeout = setTimeout(cancel, options.requestTimeoutMs);
  const runId = randomUUID();
  emitEvent(options, {
    kind: 'request',
    outcome: 'started',
    runId,
    ...(clientId === undefined ? {} : { clientId }),
    sessionId: parsed.value.sessionId,
  });
  try {
    const result = await Promise.race([
      options.executor(parsed.value, {
        signal: controller.signal,
        ...(clientId === undefined ? {} : { clientId }),
        runId,
      }),
      new Promise<ResearchExecutionResult>((resolve) =>
        controller.signal.addEventListener(
          'abort',
          () => resolve({ ok: false, error: { code: 'TIMEOUT' } }),
          { once: true },
        ),
      ),
    ]);
    if (!result.ok) {
      emitEvent(options, {
        kind: result.error.code === 'TIMEOUT' ? 'timeout' : 'request',
        outcome: 'failure',
        runId,
        ...(clientId === undefined ? {} : { clientId }),
        sessionId: parsed.value.sessionId,
      });
      writeApplicationError(response, result.error.code, headers);
      return;
    }
    emitEvent(options, {
      kind: 'request',
      outcome: 'success',
      runId,
      ...(clientId === undefined ? {} : { clientId }),
      sessionId: parsed.value.sessionId,
    });
    writeJson({ response, status: HTTP_OK, body: result.value, headers });
  } finally {
    clearTimeout(timeout);
    request.removeListener('aborted', cancel);
    request.removeListener('close', cancel);
  }
}

function emitEvent(
  options: {
    telemetry: { emit(event: TelemetryEvent): void };
    metrics: { record(event: TelemetryEvent): void };
  },
  event: TelemetryEvent,
): void {
  options.telemetry.emit(event);
  options.metrics.record(event);
}

function isRoute({
  request,
  method,
  path,
}: {
  request: IncomingMessage;
  method: string;
  path: string;
}): boolean {
  return request.method === method && request.url === path;
}

async function readJsonBody(
  request: IncomingMessage,
  maxBodyBytes: number,
): Promise<unknown> {
  let size = 0;
  let body = '';
  for await (const chunk of request) {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    size += Buffer.byteLength(text);
    if (size > maxBodyBytes) throw new RequestBodyError();
    body += text;
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new RequestBodyError();
  }
}

class RequestBodyError extends Error {}

function errorCategory(error: unknown): ErrorCategory {
  if (error instanceof RequestBodyError) return 'INVALID_REQUEST';
  if (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    typeof error.category === 'string' &&
    applicationErrorCategories.has(error.category)
  ) {
    return error.category as ErrorCategory;
  }
  return 'INTERNAL_ERROR';
}

function writeApplicationError(
  response: ServerResponse,
  category: ErrorCategory,
  headers: Record<string, string>,
): void {
  const publicError = toPublicError(createApplicationError(category));
  writeJson({
    response,
    status: publicError.status,
    body: publicError.body,
    headers,
  });
}

function responseHeaders(
  request: IncomingMessage,
  corsOrigins: string[],
): Record<string, string> {
  const headers: Record<string, string> = {
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'",
    'referrer-policy': 'no-referrer',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  };
  const origin = request.headers?.origin;
  if (origin && origin !== '*' && corsOrigins.includes(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-credentials'] = 'true';
    headers.vary = 'Origin';
  }
  return headers;
}
