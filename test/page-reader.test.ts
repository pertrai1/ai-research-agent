import { describe, expect, it } from 'vitest';

import {
  classifyAddress,
  createPageReaderTool,
  createPageReaderTransport,
} from '../src/page-reader.js';

describe('page reader URL policy', () => {
  it('rejects prohibited IPv4, IPv6, mapped, and metadata destinations', () => {
    expect(classifyAddress('127.0.0.1')).toBe('prohibited');
    expect(classifyAddress('10.0.0.8')).toBe('prohibited');
    expect(classifyAddress('169.254.169.254')).toBe('prohibited');
    expect(classifyAddress('::1')).toBe('prohibited');
    expect(classifyAddress('fc00::1')).toBe('prohibited');
    expect(classifyAddress('::ffff:127.0.0.1')).toBe('prohibited');
    expect(classifyAddress('203.0.113.10')).toBe('prohibited');
    expect(classifyAddress('8.8.8.8')).toBe('public');
  });

  it('rejects credentials and non-http URLs before DNS or fetch', async () => {
    let lookups = 0;
    let requests = 0;
    const tool = createPageReaderTool({
      transport: createPageReaderTransport({
        resolveHostname: async () => {
          lookups += 1;
          return ['8.8.8.8'];
        },
        fetch: async () => {
          requests += 1;
          return new Response('unused');
        },
      }),
    });

    await expect(
      tool.execute({ url: 'http://user:pass@example.com' }),
    ).resolves.toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    await expect(tool.execute({ url: 'file:///etc/passwd' })).resolves.toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(lookups).toBe(0);
    expect(requests).toBe(0);
  });

  it('revalidates redirects and extracts bounded untrusted HTML', async () => {
    const requests: string[] = [];
    const telemetry: unknown[] = [];
    const tool = createPageReaderTool({
      onTelemetry: (event) => telemetry.push(event),
      transport: createPageReaderTransport({
        resolveHostname: async (hostname) =>
          hostname === 'public.example' ? ['8.8.8.8'] : ['127.0.0.1'],
        fetch: async (url) => {
          requests.push(url);
          return new Response(
            '<html><title>Example</title><script>steal()</script><p>Hello &amp; world</p></html>',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
            },
          );
        },
      }),
    });

    await expect(
      tool.execute({ url: 'https://public.example/start' }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        finalUrl: 'https://public.example/start',
        title: 'Example',
      },
    });
    const result = await tool.execute({ url: 'https://public.example/start' });
    expect(result.ok && result.value.content).toContain('Hello & world');
    expect(result.ok && result.value.content).not.toContain('steal()');
    expect(result.ok && result.value.content).toContain(
      'UNTRUSTED WEB CONTENT',
    );
    expect(requests).toHaveLength(2);
    expect(telemetry).toEqual([
      {
        durationMs: expect.any(Number),
        hostname: 'public.example',
        outcome: 'success',
        resultSize: expect.any(Number),
      },
      {
        durationMs: expect.any(Number),
        hostname: 'public.example',
        outcome: 'success',
        resultSize: expect.any(Number),
      },
    ]);
  });

  it('rejects a redirect to a prohibited destination', async () => {
    const tool = createPageReaderTool({
      transport: createPageReaderTransport({
        resolveHostname: async (hostname) =>
          hostname === 'public.example' ? ['8.8.8.8'] : ['10.0.0.1'],
        fetch: async () =>
          new Response(null, {
            status: 302,
            headers: { location: 'https://internal.example/' },
          }),
      }),
    });

    await expect(
      tool.execute({ url: 'https://public.example/start' }),
    ).resolves.toEqual({
      ok: false,
      error: { code: 'PAGE_RETRIEVAL_REJECTED' },
    });
  });

  it('rejects unsupported and oversized responses with sanitized telemetry', async () => {
    const tool = createPageReaderTool({
      transport: createPageReaderTransport({
        maxResponseBytes: 4,
        resolveHostname: async () => ['8.8.8.8'],
        fetch: async () =>
          new Response('too large', {
            headers: { 'content-type': 'application/octet-stream' },
          }),
      }),
    });

    await expect(
      tool.execute({ url: 'https://public.example/binary?secret=hidden' }),
    ).resolves.toEqual({
      ok: false,
      error: { code: 'PAGE_RETRIEVAL_FAILURE' },
    });
  });
});
