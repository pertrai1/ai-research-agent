import { Tool } from '@cadmusgroup-llc/cg-agent-flow-tools';
import { z } from 'zod';

import type { PageReaderResult } from './page-reader.js';
import type { ResearchAgentDependencies } from './research-agent.js';
import type { WebSearchResult } from './web-search.js';

const MAX_QUERY_LENGTH = 300;
const searchInput = z
  .object({ query: z.string().trim().min(1).max(MAX_QUERY_LENGTH) })
  .strict();
const pageInput = z.object({ url: z.url() }).strict();

export function createResearchToolResolver(
  dependencies: ResearchAgentDependencies,
): (name: string) => Tool | undefined {
  const tools = {
    web_search: toFrameworkTool({
      name: 'web_search',
      description: 'Search the public web for bounded, relevant results.',
      schema: searchInput,
      implementation: dependencies.webSearch,
    }),
    read_page: toFrameworkTool({
      name: 'read_page',
      description: 'Read one public page as bounded untrusted evidence.',
      schema: pageInput,
      implementation: dependencies.readPage,
    }),
  };
  return (name) =>
    name === 'web_search' || name === 'read_page' ? tools[name] : undefined;
}

export function trackDependencies(
  dependencies: ResearchAgentDependencies,
  observedUrls: Set<string>,
): ResearchAgentDependencies {
  return {
    webSearch: {
      name: 'web_search',
      execute: async (input) => {
        const result = (await dependencies.webSearch.execute(
          input,
        )) as WebSearchResult;
        if (result.ok) {
          for (const item of result.value.results) observedUrls.add(item.url);
        }
        return result;
      },
    },
    readPage: {
      name: 'read_page',
      execute: async (input) => {
        const result = (await dependencies.readPage.execute(
          input,
        )) as PageReaderResult;
        if (result.ok) {
          observedUrls.add(result.value.requestedUrl);
          observedUrls.add(result.value.finalUrl);
        }
        return result;
      },
    },
  };
}

function toFrameworkTool<TInput>({
  name,
  description,
  schema,
  implementation,
}: {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  implementation: { execute(input: unknown): Promise<unknown> };
}): Tool {
  return new Tool({
    name,
    description,
    schema,
    execute: async (input) =>
      JSON.stringify(await implementation.execute(input)),
  });
}
