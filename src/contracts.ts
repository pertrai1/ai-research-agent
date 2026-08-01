import { z } from 'zod';

export const MAX_TOPIC_LENGTH = 300;
export const MAX_BRIEF_WORDS = 500;
export const MAX_SEARCH_QUERY_LENGTH = 300;
export const MAX_SEARCH_RESULTS = 5;
export const MAX_PAGE_CONTENT_LENGTH = 100_000;

const researchRequestSchema = z
  .object({
    topic: z.string().trim().min(1).max(MAX_TOPIC_LENGTH),
    sessionId: z.string().trim().min(1).optional(),
  })
  .strict();

export type ResearchRequest = z.infer<typeof researchRequestSchema> & {
  sessionId: string;
};

export type ContractResult<T, TCode extends string = 'INVALID_REQUEST'> =
  { ok: true; value: T } | { ok: false; error: { code: TCode } };

const sourceSchema = z
  .object({
    title: z.string().trim().min(1),
    url: z.url().refine(isHttpUrl),
  })
  .strict();

const researchResponseSchema = z
  .object({
    brief: z.string().trim().min(1).refine(hasAtMostBriefWordLimit),
    runId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
    sources: z.array(sourceSchema),
    topic: z.string().trim().min(1).max(MAX_TOPIC_LENGTH),
    uncertainty: z.string().trim().min(1).nullable(),
  })
  .strict();

export type ResearchResponse = z.infer<typeof researchResponseSchema>;

const searchInputSchema = z
  .object({
    query: z.string().trim().min(1).max(MAX_SEARCH_QUERY_LENGTH),
  })
  .strict();

const tavilyResultSchema = z
  .object({
    content: z.string().trim().min(1),
    score: z.number().finite().optional(),
    title: z.string().trim().min(1),
    url: z.url().refine(isHttpUrl),
  })
  .strict();

const tavilySearchResponseSchema = z
  .object({ results: z.array(tavilyResultSchema).max(MAX_SEARCH_RESULTS) })
  .strict();

const pageReaderInputSchema = z
  .object({ url: z.url().refine(isCredentialFreeHttpUrl) })
  .strict();

const pageReaderOutputSchema = z
  .object({
    content: z.string().trim().min(1).max(MAX_PAGE_CONTENT_LENGTH),
    finalUrl: z.url().refine(isCredentialFreeHttpUrl),
    requestedUrl: z.url().refine(isCredentialFreeHttpUrl),
    title: z.string().trim().min(1).optional(),
  })
  .strict();

export type SearchInput = z.infer<typeof searchInputSchema>;
export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
};
export type SearchResults = { results: SearchResult[] };
export type PageReaderInput = z.infer<typeof pageReaderInputSchema>;
export type PageReaderOutput = z.infer<typeof pageReaderOutputSchema>;

export function parseResearchRequest(
  input: unknown,
  generateSessionId: () => string,
): ContractResult<ResearchRequest> {
  const parsed = researchRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_REQUEST' } };
  }

  return {
    ok: true,
    value: {
      topic: parsed.data.topic,
      sessionId: parsed.data.sessionId ?? generateSessionId(),
    },
  };
}

export function parseResearchResponse(
  input: unknown,
): ContractResult<ResearchResponse, 'INVALID_AGENT_OUTPUT'> {
  const parsed = researchResponseSchema.safeParse(input);

  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: { code: 'INVALID_AGENT_OUTPUT' } };
}

export function parseSearchInput(input: unknown): ContractResult<SearchInput> {
  return parseContract({
    schema: searchInputSchema,
    input,
    code: 'INVALID_REQUEST',
  });
}

export function parseTavilySearchResponse(
  input: unknown,
): ContractResult<SearchResults, 'INVALID_PROVIDER_PAYLOAD'> {
  const parsed = tavilySearchResponseSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_PROVIDER_PAYLOAD' } };
  }

  return {
    ok: true,
    value: {
      results: parsed.data.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        ...(result.score === undefined ? {} : { relevanceScore: result.score }),
      })),
    },
  };
}

export function parsePageReaderInput(
  input: unknown,
): ContractResult<PageReaderInput> {
  return parseContract({
    schema: pageReaderInputSchema,
    input,
    code: 'INVALID_REQUEST',
  });
}

export function parsePageReaderOutput(
  input: unknown,
): ContractResult<PageReaderOutput, 'INVALID_TOOL_OUTPUT'> {
  return parseContract({
    schema: pageReaderOutputSchema,
    input,
    code: 'INVALID_TOOL_OUTPUT',
  });
}

function hasAtMostBriefWordLimit(value: string): boolean {
  return value.split(/\s+/u).filter(Boolean).length <= MAX_BRIEF_WORDS;
}

function isHttpUrl(value: string): boolean {
  const url = new URL(value);
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isCredentialFreeHttpUrl(value: string): boolean {
  const url = new URL(value);
  return isHttpUrl(value) && url.username === '' && url.password === '';
}

function parseContract<T, TCode extends string>({
  schema,
  input,
  code,
}: {
  schema: z.ZodType<T>;
  input: unknown;
  code: TCode;
}): ContractResult<T, TCode>;
function parseContract<T, TCode extends string>(options: {
  schema: z.ZodType<T>;
  input: unknown;
  code: TCode;
}): ContractResult<T, TCode> {
  const { schema, input, code } = options;
  const parsed = schema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: { code } };
}
