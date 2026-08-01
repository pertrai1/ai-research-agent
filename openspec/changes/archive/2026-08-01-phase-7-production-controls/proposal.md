## Why

Phase 6 provides a functional HTTP research service, but its public surface is
not yet safe to expose: callers are unauthenticated, requests can consume
unbounded service capacity, disconnects do not cancel work, and operational
signals are not consistently correlated or privacy-safe. Phase 7 closes those
production-control gaps before deployment work begins.

## What Changes

- Require API-key authentication for research and readiness requests while
  keeping liveness provider-free.
- Add bounded request bodies, per-client rate limiting, concurrency
  backpressure, explicit CORS policy, and standard security headers.
- Add total request deadlines and client-disconnect cancellation through the
  research execution and retrieval boundaries.
- Declare and test a per-run AgentFlow CostGuard budget with error behavior,
  preserving the documented distinction between per-run and agent-instance
  limits.
- Add structured, correlated lifecycle telemetry and privacy-safe metrics for
  requests, agent/provider/tool activity, guardrails, budgets, timeouts,
  validation, failures, iteration exhaustion, tokens, and estimated cost.
- Centralize redaction for prompts, retrieved content, credentials, headers,
  provider errors, and traces.
- Add deterministic tests for all controls and update the Phase 7 roadmap
  evidence.

## Capabilities

### New Capabilities

- `public-api-controls`: Authentication, request limits, rate limiting,
  concurrency/backpressure, CORS, and security headers at the HTTP boundary.
- `bounded-research-execution`: Request deadlines, cancellation propagation,
  bounded retry behavior, and per-run cost enforcement.
- `privacy-safe-observability`: Correlated structured events, metrics, and
  centralized redaction without sensitive content leakage.

### Modified Capabilities

- `react-research-agent`: Require a YAML-declared CostGuard budget and expose
  the configured lifecycle behavior needed by the service.

## Impact

- Affected code: `src/http-service.ts`, `src/research-agent.ts`,
  `src/research-agent-tools.ts`, retrieval transports, new observability and
  control modules, and `config/agents/research-agent.yaml`.
- Affected API: protected `/research` and `/ready` requests gain stable
  control-error responses and response headers; `/health` remains a cheap
  liveness endpoint.
- Affected tests: new deterministic API-control, reliability, telemetry, and
  redaction suites; existing service and agent tests must remain provider-free.
- No new runtime dependency is planned; installed CG AgentFlow 0.17.1 APIs
  will be verified from the package sources and integration-tested.
