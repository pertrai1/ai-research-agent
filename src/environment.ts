import { z } from 'zod';

const DEFAULT_PORT = 3000;
const MAX_PORT = 65_535;

const environmentSchema = z.object({
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(MAX_PORT).default(DEFAULT_PORT),
  TAVILY_API_KEY: z.string().trim().min(1).optional(),
});

export type Environment = {
  environment: 'development' | 'test' | 'production';
  port: number;
  anthropicApiKey?: string;
  tavilyApiKey?: string;
};

export type EnvironmentLoadResult =
  | { ok: true; value: Environment }
  | {
      ok: false;
      error: { code: 'INVALID_ENVIRONMENT'; fields: string[] };
    };

export function loadEnvironment(
  input: Record<string, string | undefined>,
): EnvironmentLoadResult {
  const parsed = environmentSchema.safeParse(input);

  if (!parsed.success) {
    return invalidEnvironment(
      parsed.error.issues.map((issue) => String(issue.path[0])),
    );
  }

  const { ANTHROPIC_API_KEY, NODE_ENV, PORT, TAVILY_API_KEY } = parsed.data;
  const missingProductionSecrets =
    NODE_ENV === 'production'
      ? [
          ...(ANTHROPIC_API_KEY === undefined ? ['ANTHROPIC_API_KEY'] : []),
          ...(TAVILY_API_KEY === undefined ? ['TAVILY_API_KEY'] : []),
        ]
      : [];

  if (missingProductionSecrets.length > 0) {
    return invalidEnvironment(missingProductionSecrets);
  }

  return {
    ok: true,
    value: {
      environment: NODE_ENV,
      port: PORT,
      ...(ANTHROPIC_API_KEY === undefined
        ? {}
        : { anthropicApiKey: ANTHROPIC_API_KEY }),
      ...(TAVILY_API_KEY === undefined ? {} : { tavilyApiKey: TAVILY_API_KEY }),
    },
  };
}

function invalidEnvironment(fields: string[]): EnvironmentLoadResult {
  return {
    ok: false,
    error: {
      code: 'INVALID_ENVIRONMENT',
      fields: [...new Set(fields)].sort(),
    },
  };
}
