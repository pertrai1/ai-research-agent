## 1. Contracts and control policy

- [ ] 1.1 Add failing tests for API-key authentication, derived client identity, stable auth errors, and protected `/ready` with public `/health`.
- [ ] 1.2 Add failing tests for body-size limits, per-client rate windows, concurrency backpressure, explicit CORS, and security headers.
- [ ] 1.3 Define typed request-control options, request context, admission results, and sanitized control error categories.
- [ ] 1.4 Implement injectable authentication, rate-limit, concurrency, body-limit, CORS, and security-header policies with safe defaults.
- [ ] 1.5 Integrate controls into the HTTP service and production entry point without changing the existing validated research contract.

## 2. Agent budget and reliability

- [ ] 2.1 Inspect the installed CG AgentFlow 0.17.1 CostGuard types and runtime behavior; record a dated finding if package behavior differs from the published baseline.
- [ ] 2.2 Add failing YAML/spec tests for `maxCostPerRequest`, `onExceeded: error`, overshoot margin, and rejection of misleading session-quota configuration.
- [ ] 2.3 Declare the Phase 7 budget in `config/agents/research-agent.yaml` and validate it through the existing factory path.
- [ ] 2.4 Add failing tests for total deadlines, provider/tool cancellation, client disconnects, retryable-only backoff, and no broad full-run retry.
- [ ] 2.5 Thread request-scoped AbortSignals and deadlines through executor, agent, provider, and tool seams, then map timeout/cancellation failures.
- [ ] 2.6 Compose CostGuard and request lifecycle hooks and add integration tests proving budget exhaustion stops further model calls.

## 3. Observability and privacy

- [ ] 3.1 Add failing event-schema tests covering request, agent, tool, provider, guardrail, budget, timeout, validation, and iteration-exhaustion events with correlation IDs.
- [ ] 3.2 Add failing metrics tests for rate, success, latency, tool/provider failures, iteration exhaustion, tokens, and estimated cost.
- [ ] 3.3 Implement centralized allow-listed event sanitization, identifier hashing, bounded labels, and sensitive-data redaction.
- [ ] 3.4 Wire structured logs, AgentFlow tracing hooks, and metrics sinks through the request and agent lifecycle.
- [ ] 3.5 Add leak tests proving prompts, pages, credentials, headers, raw provider errors, traces, and filesystem paths never escape through responses or telemetry.

## 4. Refactor, roadmap, and verification

- [ ] 4.1 Refactor middleware and lifecycle composition while all new and existing deterministic tests remain green.
- [ ] 4.2 Update `ROADMAP.md` Phase 7 task evidence and status only after all Phase 7 exit criteria are demonstrated.
- [ ] 4.3 Run strict OpenSpec validation and produce the verification summary with functional, coverage, integration, boundary, and unverified-risk evidence.
- [ ] 4.4 Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build` and resolve all in-scope failures.
