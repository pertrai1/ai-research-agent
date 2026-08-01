import { EventEmitter } from 'node:events';

import { describe, expect, it } from 'vitest';

import {
  createResearchHttpServer,
  shutdownResearchHttpServer,
  type ResearchExecutor,
} from '../src/http-service.js';

const response = {
  topic: 'climate policy',
  sessionId: 'session-a',
  runId: 'run-a',
  brief: 'A grounded brief.',
  sources: [{ title: 'Source', url: 'https://example.com/source' }],
  uncertainty: null,
};

class TypedFailureError extends Error {
  readonly category = 'LLM_PROVIDER_FAILURE';
}

async function call({
  server,
  method,
  path,
  body,
  headers,
}: {
  server: ReturnType<typeof createResearchHttpServer>;
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<{ status: number; body: unknown }> {
  return await new Promise((resolve) => {
    const request = new FakeRequest(method, path, body, headers);
    const response = new FakeResponse((status, payload) =>
      resolve({ status, body: JSON.parse(payload) }),
    );
    server.emit('request', request, response);
  });
}

class FakeRequest extends EventEmitter {
  readonly headers: Record<string, string>;

  constructor(
    readonly method: string,
    readonly url: string,
    private readonly body?: unknown,
    headers: Record<string, string> = {},
  ) {
    super();
    this.headers = headers;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<Buffer> {
    if (this.body !== undefined) yield Buffer.from(JSON.stringify(this.body));
  }
}

class FakeResponse extends EventEmitter {
  headersSent = false;
  statusCode = 0;
  headers: Record<string, string | number> = {};

  constructor(
    private readonly finish: (status: number, payload: string) => void,
  ) {
    super();
  }

  writeHead(
    status: number,
    headers: Record<string, string | number> = {},
  ): this {
    this.statusCode = status;
    this.headers = headers;
    this.headersSent = true;
    return this;
  }

  end(payload: string): this {
    this.finish(this.statusCode, payload);
    return this;
  }
}

describe('research HTTP service', () => {
  it('returns a validated research response and preserves the supplied session', async () => {
    const seen: Array<{ topic: string; sessionId: string }> = [];
    const executor: ResearchExecutor = async ({ topic, sessionId }) => {
      seen.push({ topic, sessionId });
      return { ok: true, value: { ...response, topic, sessionId } };
    };
    const server = createResearchHttpServer({ executor });

    const result = await call({
      server,
      method: 'POST',
      path: '/research',
      body: {
        topic: '  climate policy  ',
        sessionId: 'session-a',
      },
    });
    await shutdownResearchHttpServer(server);

    expect(result).toEqual({
      status: 200,
      body: { ...response, topic: 'climate policy' },
    });
    expect(seen).toEqual([{ topic: 'climate policy', sessionId: 'session-a' }]);
  });

  it('generates a session ID and rejects invalid bodies without executing', async () => {
    let calls = 0;
    const server = createResearchHttpServer({
      executor: async ({ topic, sessionId }) => {
        calls += 1;
        return { ok: true, value: { ...response, topic, sessionId } };
      },
      generateSessionId: () => 'generated-session',
    });

    const generated = await call({
      server,
      method: 'POST',
      path: '/research',
      body: {
        topic: ' topic ',
      },
    });
    const invalid = await call({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: '   ' },
    });
    await shutdownResearchHttpServer(server);

    expect(generated.body).toMatchObject({
      sessionId: 'generated-session',
      topic: 'topic',
    });
    expect(invalid).toEqual({
      status: 400,
      body: {
        error: { code: 'INVALID_REQUEST', message: 'The request is invalid.' },
      },
    });
    expect(calls).toBe(1);
  });

  it('provides provider-free health and readiness checks', async () => {
    let calls = 0;
    const server = createResearchHttpServer({
      executor: async () => {
        calls += 1;
        return { ok: true, value: response };
      },
      ready: () => true,
    });

    const health = await call({ server, method: 'GET', path: '/health' });
    const ready = await call({ server, method: 'GET', path: '/ready' });
    await shutdownResearchHttpServer(server);

    expect(health).toEqual({ status: 200, body: { status: 'ok' } });
    expect(ready).toEqual({ status: 200, body: { status: 'ready' } });
    expect(calls).toBe(0);
  });

  it('maps typed and unexpected failures to sanitized public errors', async () => {
    const server = createResearchHttpServer({
      executor: async () => {
        throw new TypedFailureError('secret-key /private/path stack trace');
      },
    });

    const result = await call({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'topic' },
    });
    await shutdownResearchHttpServer(server);

    expect(result).toEqual({
      status: 502,
      body: {
        error: {
          code: 'LLM_PROVIDER_FAILURE',
          message:
            'The language model provider could not complete the request.',
        },
      },
    });
    expect(JSON.stringify(result.body)).not.toContain('secret-key');
    expect(JSON.stringify(result.body)).not.toContain('/private/path');
  });

  it('reports unavailable readiness without executing the agent', async () => {
    const server = createResearchHttpServer({
      executor: async () => ({ ok: true, value: response }),
      ready: () => false,
    });
    const result = await call({ server, method: 'GET', path: '/ready' });
    await shutdownResearchHttpServer(server);

    expect(result).toEqual({ status: 503, body: { status: 'not_ready' } });
  });

  it('drains an in-flight research request during shutdown', async () => {
    let releaseRun!: () => void;
    let started!: () => void;
    const runStarted = new Promise<void>((resolve) => (started = resolve));
    const runReleased = new Promise<void>((resolve) => (releaseRun = resolve));
    const server = createResearchHttpServer({
      executor: async ({ topic, sessionId }) => {
        started();
        await runReleased;
        return { ok: true, value: { ...response, topic, sessionId } };
      },
    });

    const requestPromise = call({
      server,
      method: 'POST',
      path: '/research',
      body: {
        topic: 'topic',
      },
    });
    await runStarted;
    let shutdownFinished = false;
    const shutdown = shutdownResearchHttpServer(server).then(
      () => (shutdownFinished = true),
    );
    await Promise.resolve();
    expect(shutdownFinished).toBe(false);

    releaseRun();
    await expect(requestPromise).resolves.toMatchObject({ status: 200 });
    await shutdown;
    expect(shutdownFinished).toBe(true);
  });

  it('rejects unauthenticated public requests and keeps health public', async () => {
    let calls = 0;
    const server = createResearchHttpServer({
      apiKey: 'api-secret',
      executor: async () => {
        calls += 1;
        return { ok: true, value: response };
      },
    });

    const research = await call({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'topic' },
    });
    const health = await call({ server, method: 'GET', path: '/health' });
    await shutdownResearchHttpServer(server);

    expect(research).toEqual({
      status: 401,
      body: {
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication is required or invalid.',
        },
      },
    });
    expect(health).toEqual({ status: 200, body: { status: 'ok' } });
    expect(calls).toBe(0);
  });

  it('enforces rate and concurrency controls for an authenticated client', async () => {
    let releaseRun!: () => void;
    let started!: () => void;
    const runStarted = new Promise<void>((resolve) => (started = resolve));
    const runReleased = new Promise<void>((resolve) => (releaseRun = resolve));
    const server = createResearchHttpServer({
      apiKey: 'api-secret',
      maxConcurrent: 1,
      rateLimit: { maxRequests: 10, windowMs: 1_000_000 },
      executor: async ({ topic, sessionId }) => {
        started();
        await runReleased;
        return { ok: true, value: { ...response, topic, sessionId } };
      },
    });
    const headers = { authorization: 'Bearer api-secret' };
    const first = call({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'first' },
      headers,
    });
    await runStarted;
    const busy = await call({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'second' },
      headers,
    });
    releaseRun();
    await first;
    await shutdownResearchHttpServer(server);

    expect(busy).toEqual({
      status: 503,
      body: {
        error: {
          code: 'SERVICE_BUSY',
          message: 'The service is busy. Please try again later.',
        },
      },
    });
  });

  it('enforces per-client rate limits and emits security headers', async () => {
    const server = createResearchHttpServer({
      apiKey: 'api-secret',
      rateLimit: { maxRequests: 1, windowMs: 1_000_000 },
      executor: async ({ topic, sessionId }) => ({
        ok: true,
        value: { ...response, topic, sessionId },
      }),
    });
    const first = await callWithHeaders({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'first' },
      headers: { authorization: 'Bearer api-secret' },
    });
    const second = await callWithHeaders({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'second' },
      headers: { authorization: 'Bearer api-secret' },
    });
    await shutdownResearchHttpServer(server);

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(first.headers['x-content-type-options']).toBe('nosniff');
    expect(first.headers['content-security-policy']).toBe("default-src 'none'");
  });

  it('returns a stable timeout and aborts the request signal', async () => {
    let aborted = false;
    const server = createResearchHttpServer({
      requestTimeoutMs: 5,
      executor: async (_request, context) => {
        context?.signal.addEventListener('abort', () => (aborted = true));
        await new Promise<void>(() => undefined);
        return { ok: true, value: response };
      },
    });

    const result = await call({
      server,
      method: 'POST',
      path: '/research',
      body: { topic: 'slow' },
    });
    await shutdownResearchHttpServer(server);

    expect(result).toEqual({
      status: 503,
      body: {
        error: { code: 'TIMEOUT', message: 'The research request timed out.' },
      },
    });
    expect(aborted).toBe(true);
  });
});

async function callWithHeaders(args: {
  server: ReturnType<typeof createResearchHttpServer>;
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<{
  status: number;
  body: unknown;
  headers: Record<string, string | number>;
}> {
  return await new Promise((resolve) => {
    const request = new FakeRequest(
      args.method,
      args.path,
      args.body,
      args.headers,
    );
    const response = new FakeResponse((status, payload) =>
      resolve({ status, body: JSON.parse(payload), headers: response.headers }),
    );
    args.server.emit('request', request, response);
  });
}
