export const errorCategories = [
  'INVALID_REQUEST',
  'AUTHENTICATION_FAILED',
  'RATE_LIMITED',
  'SERVICE_BUSY',
  'TIMEOUT',
  'SEARCH_PROVIDER_FAILURE',
  'PAGE_RETRIEVAL_REJECTED',
  'PAGE_RETRIEVAL_FAILURE',
  'LLM_PROVIDER_FAILURE',
  'BUDGET_EXHAUSTED',
  'ITERATION_LIMIT_EXHAUSTED',
  'INVALID_AGENT_OUTPUT',
  'INTERNAL_ERROR',
] as const;

export type ErrorCategory = (typeof errorCategories)[number];

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_INTERNAL_SERVER_ERROR = 500;

export type ApplicationError = {
  category: ErrorCategory;
  internal?: unknown;
};

type PublicError = {
  status: number;
  body: { error: { code: ErrorCategory; message: string } };
};

const publicErrorDefinitions: Record<
  ErrorCategory,
  { status: number; message: string }
> = {
  INVALID_REQUEST: {
    status: HTTP_BAD_REQUEST,
    message: 'The request is invalid.',
  },
  AUTHENTICATION_FAILED: {
    status: HTTP_UNAUTHORIZED,
    message: 'Authentication is required or invalid.',
  },
  RATE_LIMITED: {
    status: HTTP_TOO_MANY_REQUESTS,
    message: 'Too many requests.',
  },
  SERVICE_BUSY: {
    status: HTTP_SERVICE_UNAVAILABLE,
    message: 'The service is busy. Please try again later.',
  },
  TIMEOUT: {
    status: HTTP_SERVICE_UNAVAILABLE,
    message: 'The research request timed out.',
  },
  SEARCH_PROVIDER_FAILURE: {
    status: HTTP_BAD_GATEWAY,
    message: 'The search provider could not complete the request.',
  },
  PAGE_RETRIEVAL_REJECTED: {
    status: HTTP_BAD_REQUEST,
    message: 'The requested page is not permitted.',
  },
  PAGE_RETRIEVAL_FAILURE: {
    status: HTTP_BAD_GATEWAY,
    message: 'The requested page could not be retrieved.',
  },
  LLM_PROVIDER_FAILURE: {
    status: HTTP_BAD_GATEWAY,
    message: 'The language model provider could not complete the request.',
  },
  BUDGET_EXHAUSTED: {
    status: HTTP_TOO_MANY_REQUESTS,
    message: 'The research request exceeded its allowed budget.',
  },
  ITERATION_LIMIT_EXHAUSTED: {
    status: HTTP_SERVICE_UNAVAILABLE,
    message: 'The research request exceeded its iteration limit.',
  },
  INVALID_AGENT_OUTPUT: {
    status: HTTP_BAD_GATEWAY,
    message: 'The research result could not be validated.',
  },
  INTERNAL_ERROR: {
    status: HTTP_INTERNAL_SERVER_ERROR,
    message: 'The service could not complete the request.',
  },
};

export function createApplicationError(
  category: ErrorCategory,
  internal?: unknown,
): ApplicationError {
  return internal === undefined ? { category } : { category, internal };
}

export function toPublicError(error: ApplicationError): PublicError {
  const definition = publicErrorDefinitions[error.category];

  return {
    status: definition.status,
    body: {
      error: {
        code: error.category,
        message: definition.message,
      },
    },
  };
}
