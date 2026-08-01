import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { createAgentFromFile } from '@cadmusgroup-llc/cg-agent-flow-agents';
import {
  BaseAgent,
  loadSpec,
  type AgentResult,
  type LifecycleHooks,
} from '@cadmusgroup-llc/cg-agent-flow-core';
import { parseResearchResponse, type ResearchResponse } from './contracts.js';
import {
  createResearchToolResolver,
  trackDependencies,
} from './research-agent-tools.js';
import type { PageReaderTool } from './page-reader.js';
import type { WebSearchTool } from './web-search.js';

export { createResearchToolResolver } from './research-agent-tools.js';

const DEFAULT_SPEC_PATH = resolve('config/agents/research-agent.yaml');
const APPROVED_TOOLS = ['web_search', 'read_page'] as const;
const MAX_ITERATIONS = 15;
const MAX_TOKENS = 1500;
const MAX_OBSERVATION_LENGTH = 12000;
const DEFAULT_TEMPERATURE = 0.2;

export type ResearchAgentDependencies = {
  webSearch: WebSearchTool;
  readPage: PageReaderTool;
};

export type ResearchAgentSpecSummary = {
  type: 'react';
  provider: 'anthropic';
  model: string;
  temperature: 0.2;
  maxTokens: 1500;
  maxIterations: 15;
  maxObservationLength: 12000;
  tools: ['web_search', 'read_page'];
};

export type AgentConfigResult =
  | { ok: true; value: ResearchAgentSpecSummary }
  | { ok: false; error: { code: 'INVALID_AGENT_CONFIG' } };

export type ResearchRunResult =
  | {
      ok: true;
      value: ResearchResponse;
      observedUrls: string[];
      agent: AgentResult;
    }
  | {
      ok: false;
      error: { code: 'INVALID_AGENT_OUTPUT' | 'LLM_PROVIDER_FAILURE' };
    };

export function validateResearchAgentSpec(
  specPath: string = DEFAULT_SPEC_PATH,
): AgentConfigResult {
  try {
    const spec = loadSpec(specPath, { useCache: false });
    if (spec.type !== 'react') {
      return { ok: false, error: { code: 'INVALID_AGENT_CONFIG' } };
    }
    const config = spec.config;
    if (
      config.provider !== 'anthropic' ||
      config.temperature !== DEFAULT_TEMPERATURE ||
      config.maxTokens !== MAX_TOKENS ||
      config.maxIterations !== MAX_ITERATIONS ||
      config.maxObservationLength !== MAX_OBSERVATION_LENGTH ||
      !sameTools(config.tools)
    ) {
      return { ok: false, error: { code: 'INVALID_AGENT_CONFIG' } };
    }
    return {
      ok: true,
      value: {
        type: 'react',
        provider: 'anthropic',
        model: config.model,
        temperature: DEFAULT_TEMPERATURE,
        maxTokens: MAX_TOKENS,
        maxIterations: MAX_ITERATIONS,
        maxObservationLength: MAX_OBSERVATION_LENGTH,
        tools: [...APPROVED_TOOLS],
      },
    };
  } catch {
    return { ok: false, error: { code: 'INVALID_AGENT_CONFIG' } };
  }
}

export function createResearchAgent({
  dependencies,
  specPath = DEFAULT_SPEC_PATH,
  hooks,
}: {
  dependencies: ResearchAgentDependencies;
  specPath?: string;
  hooks?: Partial<LifecycleHooks>;
}): BaseAgent {
  const config = validateResearchAgentSpec(specPath);
  if (!config.ok) {
    throw new Error('Invalid research agent configuration.');
  }

  const toolResolver = createResearchToolResolver(dependencies);

  const agent = createAgentFromFile(specPath, {
    useIsolatedRegistry: true,
    toolResolver,
  });
  const configuredAgent = agent as BaseAgent;
  if (hooks) configuredAgent.registerHooks(hooks);
  return configuredAgent;
}

export async function runResearchAgent({
  dependencies,
  specPath = DEFAULT_SPEC_PATH,
  topic,
  sessionId = randomUUID(),
  runId = randomUUID(),
  hooks,
}: {
  dependencies: ResearchAgentDependencies;
  specPath?: string;
  topic: string;
  sessionId?: string;
  runId?: string;
  hooks?: Partial<LifecycleHooks>;
}): Promise<ResearchRunResult> {
  const observedUrls = new Set<string>();
  const agent = createResearchAgent({
    dependencies: trackDependencies(dependencies, observedUrls),
    specPath,
    ...(hooks === undefined ? {} : { hooks }),
  });
  const prompt = researchPrompt({ topic, sessionId, runId });

  let agentResult = await agent.run(prompt);
  let parsed = parseGroundedAnswer(agentResult, observedUrls);
  if (!parsed.ok) {
    agentResult = await agent.run(
      `${prompt}\n\nYour previous output was invalid. Return corrected JSON only. Do not add sources not observed through tools.`,
    );
    parsed = parseGroundedAnswer(agentResult, observedUrls);
  }

  return parsed.ok
    ? {
        ok: true,
        value: parsed.value,
        observedUrls: [...observedUrls],
        agent: agentResult,
      }
    : { ok: false, error: { code: parsed.error.code } };
}

function parseGroundedAnswer(
  result: AgentResult,
  observedUrls: Set<string>,
): ReturnType<typeof parseResearchResponse> {
  if (!result.success)
    return { ok: false, error: { code: 'INVALID_AGENT_OUTPUT' } };
  let candidate: unknown;
  try {
    candidate = JSON.parse(result.answer) as unknown;
  } catch {
    return { ok: false, error: { code: 'INVALID_AGENT_OUTPUT' } };
  }
  const parsed = parseResearchResponse(candidate);
  if (
    !parsed.ok ||
    parsed.value.sources.some((source) => !observedUrls.has(source.url))
  ) {
    return { ok: false, error: { code: 'INVALID_AGENT_OUTPUT' } };
  }
  return parsed;
}

function sameTools(
  tools: string[] | undefined,
): tools is ['web_search', 'read_page'] {
  return tools?.join('|') === APPROVED_TOOLS.join('|');
}

function researchPrompt({
  topic,
  sessionId,
  runId,
}: {
  topic: string;
  sessionId: string;
  runId: string;
}): string {
  return `Research this topic: ${topic}\nReturn JSON with topic "${topic}", sessionId "${sessionId}", runId "${runId}", brief, sources, and uncertainty.`;
}
