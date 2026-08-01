import { resolve } from 'node:path';

import { createAgentFromFile } from '@cadmusgroup-llc/cg-agent-flow-agents';
import { BaseAgent, type Guardrail } from '@cadmusgroup-llc/cg-agent-flow-core';
import {
  OutputValidationGuardrail,
  outputValidationConfigSchema,
  PromptInjectionGuardrail,
  promptInjectionConfigSchema,
  SecretsRedactionGuardrail,
  secretsRedactionConfigSchema,
} from '@cadmusgroup-llc/cg-agent-flow-guardrails';

import { createResearchToolResolver } from './research-agent-tools.js';
import type { ResearchAgentDependencies } from './research-agent.js';

export const SHOWCASE_SPEC_PATH = resolve(
  'config/agents/framework-showcase.yaml',
);

type ShowcaseGuardrailResolver = (
  type: string,
  config: Record<string, unknown> | undefined,
  direction: 'input' | 'output',
) => Guardrail | undefined;

export function createShowcaseGuardrailResolver(): ShowcaseGuardrailResolver {
  return (...args: Parameters<ShowcaseGuardrailResolver>) => {
    const type = args.at(0);
    const config = args.at(1);
    const direction = args.at(2);
    if (type === 'prompt-injection' && direction === 'input') {
      return new PromptInjectionGuardrail(
        promptInjectionConfigSchema.parse(config ?? {}),
      );
    }
    if (type === 'secrets-redaction' && direction === 'output') {
      return new SecretsRedactionGuardrail(
        secretsRedactionConfigSchema.parse(config ?? {}),
      );
    }
    if (type === 'output-validation' && direction === 'output') {
      return new OutputValidationGuardrail(
        outputValidationConfigSchema.parse(config ?? {}),
      );
    }
    return undefined;
  };
}

export function createShowcaseAgent({
  dependencies,
}: {
  dependencies: ResearchAgentDependencies;
}): BaseAgent {
  return createAgentFromFile(SHOWCASE_SPEC_PATH, {
    useIsolatedRegistry: true,
    toolResolver: createResearchToolResolver(dependencies),
    guardrailResolver: createShowcaseGuardrailResolver(),
  }) as BaseAgent;
}
