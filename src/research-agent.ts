import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { createAgentFromFile } from '@cadmusgroup-llc/cg-agent-flow-agents';
import {
  BaseAgent,
  loadSpec,
  type AgentResult,
  type LifecycleHooks,
} from '@cadmusgroup-llc/cg-agent-flow-core';
import {
  parseResearchResponse,
  type ContractResult,
  type ResearchResponse,
} from './contracts.js';
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
const DEFAULT_MEMORY_MAX_MESSAGES = 50;
const MAX_COST_PER_REQUEST = 0.5;
type ReactAgentSpec = Extract<ReturnType<typeof loadSpec>, { type: 'react' }>;

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
  maxCostPerRequest: 0.5;
  onExceeded: 'error';
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
      error: {
        code:
          | 'INVALID_AGENT_OUTPUT'
          | 'LLM_PROVIDER_FAILURE'
          | 'BUDGET_EXHAUSTED'
          | 'TIMEOUT';
      };
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
      !hasExpectedAgentConfig(config) ||
      !hasExpectedBudgetConfig(spec.budget) ||
      !hasExpectedMemoryConfig(spec.memory)
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
        maxCostPerRequest: MAX_COST_PER_REQUEST,
        onExceeded: 'error',
        tools: [...APPROVED_TOOLS],
      },
    };
  } catch {
    return { ok: false, error: { code: 'INVALID_AGENT_CONFIG' } };
  }
}

function hasExpectedBudgetConfig(budget: ReactAgentSpec['budget']): boolean {
  return (
    budget?.maxCostPerRequest === MAX_COST_PER_REQUEST &&
    budget.onExceeded === 'error' &&
    budget.maxCostPerSession === undefined
  );
}

function hasExpectedAgentConfig(config: ReactAgentSpec['config']): boolean {
  return (
    config.provider === 'anthropic' &&
    config.temperature === DEFAULT_TEMPERATURE &&
    config.maxTokens === MAX_TOKENS &&
    config.maxIterations === MAX_ITERATIONS &&
    config.maxObservationLength === MAX_OBSERVATION_LENGTH &&
    sameTools(config.tools)
  );
}

function hasExpectedMemoryConfig(memory: ReactAgentSpec['memory']): boolean {
  const configs = Array.isArray(memory) ? memory : memory ? [memory] : [];
  const conversation = configs.find((item) => item.type === 'conversation');
  return (
    conversation?.strategy === 'sliding-window' &&
    conversation.maxMessages === DEFAULT_MEMORY_MAX_MESSAGES &&
    conversation.sessionField === 'sessionId'
  );
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
  signal,
  hooks,
}: {
  dependencies: ResearchAgentDependencies;
  specPath?: string;
  topic: string;
  sessionId?: string;
  runId?: string;
  signal?: AbortSignal;
  hooks?: Partial<LifecycleHooks>;
}): Promise<ResearchRunResult> {
  const observedUrls = new Set<string>();
  const runDependencies =
    signal === undefined
      ? dependencies
      : {
          webSearch: {
            name: 'web_search' as const,
            execute: (input: unknown) =>
              dependencies.webSearch.execute(input, signal),
          },
          readPage: {
            name: 'read_page' as const,
            execute: (input: unknown) =>
              dependencies.readPage.execute(input, signal),
          },
        };
  const agent = createResearchAgent({
    dependencies: trackDependencies(runDependencies, observedUrls),
    specPath,
    hooks: {
      ...(hooks ?? {}),
      ...(signal === undefined ? {} : cancellationHooks(signal)),
    },
  });
  const prompt = researchPrompt({ topic, sessionId, runId });

  let agentResult = await agent.run(prompt, {
    sessionId,
    ...(signal === undefined ? {} : { signal }),
  });
  let parsed = parseGroundedAnswer(agentResult, observedUrls);
  if (!parsed.ok && parsed.error.code === 'INVALID_AGENT_OUTPUT') {
    agentResult = await agent.run(
      `${prompt}\n\nYour previous output was invalid. Return corrected JSON only. Do not add sources not observed through tools.`,
      { sessionId, ...(signal === undefined ? {} : { signal }) },
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
): ContractResult<
  ResearchResponse,
  | 'INVALID_AGENT_OUTPUT'
  | 'LLM_PROVIDER_FAILURE'
  | 'BUDGET_EXHAUSTED'
  | 'TIMEOUT'
> {
  if (!result.success) {
    const name = result.error?.name;
    return {
      ok: false,
      error: {
        code:
          name === 'BudgetExceededError'
            ? 'BUDGET_EXHAUSTED'
            : name === 'AbortError'
              ? 'TIMEOUT'
              : 'LLM_PROVIDER_FAILURE',
      },
    };
  }
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

function cancellationHooks(signal: AbortSignal): Partial<LifecycleHooks> {
  const throwIfAborted = (): void => {
    if (signal.aborted) {
      const error = new Error('research request cancelled');
      error.name = 'AbortError';
      throw error;
    }
  };
  return {
    beforeRun: throwIfAborted,
    beforeModelCall: throwIfAborted,
    beforeToolCall: throwIfAborted,
  };
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
