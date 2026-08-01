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
  runResearchAgent,
  type ResearchAgentDependencies,
} from './research-agent.js';
import { writeJson } from './write-json.js';

const DEFAULT_MAX_BODY_BYTES = 1_000_000;
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_SERVICE_UNAVAILABLE = 503;
const applicationErrorCategories = new Set<string>(errorCategories);

export type ResearchExecutionResult =
  | { ok: true; value: ResearchResponse }
  | { ok: false; error: { code: ErrorCategory } };

export type ResearchExecutor = (
  request: ResearchRequest,
) => Promise<ResearchExecutionResult>;

export type ResearchHttpServerOptions = {
  executor: ResearchExecutor;
  ready?: () => boolean;
  generateSessionId?: () => string;
  maxBodyBytes?: number;
};

type ServerState = {
  accepting: boolean;
  active: number;
  drained?: () => void;
};

const serverStates = new WeakMap<Server, ServerState>();

export function createResearchExecutor(
  dependencies: ResearchAgentDependencies,
): ResearchExecutor {
  const memory = createConversationMemory(new LocalMemoryStore());
  const hooks = createMemoryHooks(memory);

  return async ({ topic, sessionId }) => {
    const result = await runResearchAgent({
      dependencies,
      topic,
      sessionId,
      hooks,
    });
    return result.ok ? { ok: true, value: result.value } : result;
  };
}

export function createResearchHttpServer({
  executor,
  ready = () => true,
  generateSessionId = randomUUID,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
}: ResearchHttpServerOptions): Server {
  const state: ServerState = { accepting: true, active: 0 };
  const server = createServer((request, response) => {
    const current = serverStates.get(server);
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
      },
    })
      .catch(() =>
        writeJson({
          response,
          status: HTTP_INTERNAL_SERVER_ERROR,
          body: toPublicError(createApplicationError('INTERNAL_ERROR')).body,
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
}: {
  request: IncomingMessage;
  response: ServerResponse;
  options: Required<ResearchHttpServerOptions>;
}): Promise<void> {
  try {
    if (isRoute({ request, method: 'GET', path: '/health' })) {
      writeJson({ response, status: HTTP_OK, body: { status: 'ok' } });
      return;
    }
    if (isRoute({ request, method: 'GET', path: '/ready' })) {
      writeJson({
        response,
        status: options.ready() ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE,
        body: {
          status: options.ready() ? 'ready' : 'not_ready',
        },
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
      });
      return;
    }

    return await handleResearchRequest({ request, response, options });
  } catch (error) {
    writeApplicationError(response, errorCategory(error));
  }
}

async function handleResearchRequest({
  request,
  response,
  options,
}: {
  request: IncomingMessage;
  response: ServerResponse;
  options: Required<ResearchHttpServerOptions>;
}): Promise<void> {
  const body = await readJsonBody(request, options.maxBodyBytes);
  const parsed = parseResearchRequest(body, options.generateSessionId);
  if (!parsed.ok) {
    writeApplicationError(response, parsed.error.code);
    return;
  }

  const result = await options.executor(parsed.value);
  if (!result.ok) {
    writeApplicationError(response, result.error.code);
    return;
  }
  writeJson({ response, status: HTTP_OK, body: result.value });
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
): void {
  const publicError = toPublicError(createApplicationError(category));
  writeJson({ response, status: publicError.status, body: publicError.body });
}
