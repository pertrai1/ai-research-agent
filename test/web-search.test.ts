import { describe, expect, it, vi } from 'vitest';

import {
  createTavilyTransport,
  createWebSearchTool,
  type SearchTelemetryEvent,
} from '../src/web-search.js';

const API_KEY = 'tvly-secret-value';

describe('web_search', () => {
  it('returns at most five normalized Tavily results and safe success telemetry', async () => {
    const requests: RequestInit[] = [];
    const events: SearchTelemetryEvent[] = [];
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      requests.push(init ?? {});
      return jsonResponse({
        results: [
          {
            content: 'Snippet 1',
            score: 0.9,
            title: 'Result 1',
            url: 'https://example.com/1',
          },
          {
            content: 'Snippet 2',
            score: 0.8,
            title: 'Result 2',
            url: 'https://example.com/2',
          },
          {
            content: 'Snippet 3',
            score: 0.7,
            title: 'Result 3',
            url: 'https://example.com/3',
          },
          {
            content: 'Snippet 4',
            score: 0.6,
            title: 'Result 4',
            url: 'https://example.com/4',
          },
          {
            content: 'Snippet 5',
            score: 0.5,
            title: 'Result 5',
            url: 'https://example.com/5',
          },
        ],
      });
    });
    const tool = createWebSearchTool({
      transport: createTavilyTransport({ apiKey: API_KEY, fetch }),
      now: sequenceClock(100, 135),
      onTelemetry: (event) => events.push(event),
    });

    const result = await tool.execute({ query: '  current research  ' });

    expect(result).toEqual({
      ok: true,
      value: {
        results: [
          {
            title: 'Result 1',
            url: 'https://example.com/1',
            snippet: 'Snippet 1',
            relevanceScore: 0.9,
          },
          {
            title: 'Result 2',
            url: 'https://example.com/2',
            snippet: 'Snippet 2',
            relevanceScore: 0.8,
          },
          {
            title: 'Result 3',
            url: 'https://example.com/3',
            snippet: 'Snippet 3',
            relevanceScore: 0.7,
          },
          {
            title: 'Result 4',
            url: 'https://example.com/4',
            snippet: 'Snippet 4',
            relevanceScore: 0.6,
          },
          {
            title: 'Result 5',
            url: 'https://example.com/5',
            snippet: 'Snippet 5',
            relevanceScore: 0.5,
          },
        ],
      },
    });
    expect(requests).toEqual([
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'current research', max_results: 5 }),
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }),
    ]);
    expect(events).toEqual([
      { durationMs: 35, outcome: 'success', resultCount: 5 },
    ]);
    expect(JSON.stringify({ result, events })).not.toContain(API_KEY);
    expect(JSON.stringify({ result, events })).not.toContain('Authorization');
  });

  it('rejects invalid input without making a provider request', async () => {
    const fetch = vi.fn();
    const tool = createWebSearchTool({
      transport: createTavilyTransport({ apiKey: API_KEY, fetch }),
    });

    await expect(tool.execute({ query: '   ' })).resolves.toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retries a transient response with bounded exponential backoff', async () => {
    const delays: number[] = [];
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'temporary' }, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              content: 'Confirmed',
              title: 'Recovered',
              url: 'https://example.com/recovered',
            },
          ],
        }),
      );
    const tool = createWebSearchTool({
      transport: createTavilyTransport({
        apiKey: API_KEY,
        fetch,
        sleep: async (delayMs) => {
          delays.push(delayMs);
        },
      }),
    });

    await expect(
      tool.execute({ query: 'retryable provider failure' }),
    ).resolves.toEqual({
      ok: true,
      value: {
        results: [
          {
            title: 'Recovered',
            url: 'https://example.com/recovered',
            snippet: 'Confirmed',
          },
        ],
      },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(delays).toEqual([100]);
  });

  it('does not retry terminal or malformed provider responses and sanitizes failures', async () => {
    const events: SearchTelemetryEvent[] = [];
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: API_KEY }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              content: 'Snippet',
              title: 'Unexpected provider field',
              url: 'https://example.com/unexpected',
              unsafe: 'not accepted',
            },
          ],
        }),
      );
    const tool = createWebSearchTool({
      transport: createTavilyTransport({ apiKey: API_KEY, fetch }),
      now: sequenceClock(40, 47, 50, 58),
      onTelemetry: (event) => events.push(event),
    });

    await expect(tool.execute({ query: 'terminal' })).resolves.toEqual({
      ok: false,
      error: { code: 'SEARCH_PROVIDER_FAILURE' },
    });
    await expect(tool.execute({ query: 'malformed' })).resolves.toEqual({
      ok: false,
      error: { code: 'SEARCH_PROVIDER_FAILURE' },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(events).toEqual([
      { durationMs: 7, outcome: 'failure', resultCount: 0 },
      { durationMs: 8, outcome: 'failure', resultCount: 0 },
    ]);
    expect(JSON.stringify(events)).not.toContain(API_KEY);
  });

  it('retries a timed-out attempt and returns a typed failure when the retry bound is exhausted', async () => {
    const delays: number[] = [];
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('timed out', 'AbortError')),
          );
        }),
    );
    const tool = createWebSearchTool({
      transport: createTavilyTransport({
        apiKey: API_KEY,
        fetch,
        maxAttempts: 2,
        scheduleTimeout: (callback) => {
          queueMicrotask(callback);
          return { cancel: () => undefined };
        },
        sleep: async (delayMs) => {
          delays.push(delayMs);
        },
        timeoutMs: 10,
      }),
    });

    await expect(tool.execute({ query: 'timeout' })).resolves.toEqual({
      ok: false,
      error: { code: 'SEARCH_PROVIDER_FAILURE' },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(delays).toEqual([100]);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sequenceClock(...timestamps: number[]): () => number {
  const values = [...timestamps];
  return () => values.shift() ?? 0;
}
