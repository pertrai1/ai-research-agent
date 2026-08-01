import { describe, expect, it } from 'vitest';

import {
  parsePageReaderInput,
  parsePageReaderOutput,
  parseSearchInput,
  parseTavilySearchResponse,
} from '../src/contracts.js';

describe('tool contracts', () => {
  it('accepts bounded search input and projects Tavily results to documented fields', () => {
    expect(parseSearchInput({ query: ' battery recycling ' })).toEqual({
      ok: true,
      value: { query: 'battery recycling' },
    });
    expect(
      parseTavilySearchResponse({
        results: [
          {
            content: 'A concise result snippet.',
            score: 0.98,
            title: 'Research paper',
            url: 'https://example.com/paper',
          },
        ],
      }),
    ).toEqual({
      ok: true,
      value: {
        results: [
          {
            relevanceScore: 0.98,
            snippet: 'A concise result snippet.',
            title: 'Research paper',
            url: 'https://example.com/paper',
          },
        ],
      },
    });
  });

  it('accepts one credential-free HTTP(S) page URL and bounded textual output', () => {
    expect(
      parsePageReaderInput({ url: 'https://example.com/article' }),
    ).toEqual({
      ok: true,
      value: { url: 'https://example.com/article' },
    });
    expect(
      parsePageReaderOutput({
        content: 'Extracted article text.',
        finalUrl: 'https://example.com/article',
        requestedUrl: 'https://example.com/article',
        title: 'Example article',
      }),
    ).toEqual({
      ok: true,
      value: {
        content: 'Extracted article text.',
        finalUrl: 'https://example.com/article',
        requestedUrl: 'https://example.com/article',
        title: 'Example article',
      },
    });
  });

  it('rejects unsupported, malformed, and out-of-bound tool or provider data', () => {
    expect(parseSearchInput({ query: ' ' })).toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(parseSearchInput({ query: 'a'.repeat(301) })).toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(
      parseTavilySearchResponse({
        results: [
          {
            content: 'Snippet',
            title: 'Title',
            unknown: 'not a documented field',
            url: 'https://example.com',
          },
        ],
      }),
    ).toEqual({ ok: false, error: { code: 'INVALID_PROVIDER_PAYLOAD' } });
    expect(
      parseTavilySearchResponse({
        results: Array.from({ length: 6 }, () => ({
          content: 'Snippet',
          title: 'Title',
          url: 'https://example.com',
        })),
      }),
    ).toEqual({ ok: false, error: { code: 'INVALID_PROVIDER_PAYLOAD' } });
    expect(
      parsePageReaderInput({ url: 'https://user:pass@example.com/article' }),
    ).toEqual({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(parsePageReaderInput({ url: 'ftp://example.com/article' })).toEqual({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(
      parsePageReaderOutput({
        content: 'Article',
        finalUrl: 'file:///private/article',
        requestedUrl: 'https://example.com/article',
      }),
    ).toEqual({ ok: false, error: { code: 'INVALID_TOOL_OUTPUT' } });
  });
});
