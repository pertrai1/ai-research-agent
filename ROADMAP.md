# AI Research Agent Roadmap

## Purpose and authority

This roadmap turns [`REQUIREMENTS.md`](./REQUIREMENTS.md) into an ordered implementation plan for the initial AI research agent release. `REQUIREMENTS.md` remains the authoritative product contract: this file tracks delivery but does not replace, weaken, or expand those requirements. Any scope change must be reconciled with the requirements first.

All application, test, infrastructure, and deployment tasks below begin unchecked. Creating this roadmap does not mean the product has been implemented.

## How to use this roadmap

- Complete phases in order unless a task explicitly has no dependency on an incomplete phase.
- A checkbox records task completion; a phase is complete only when every task is checked and every exit criterion passes.
- For observable behavior, use red-green-refactor: add and confirm a failing test, implement the smallest passing behavior, then refactor while relevant tests remain green.
- Requirement references point to `REQUIREMENTS.md`: `FR-*`, `SEC-*`, section numbers such as `§8`, and acceptance criteria such as `AC-6`.
- Add discovered work to the applicable phase with a requirement reference or a brief rationale.

## Phase overview

| Phase                                    | Outcome                                                            | Depends on |
| ---------------------------------------- | ------------------------------------------------------------------ | ---------- |
| 1. Project foundations                   | Reproducible, secret-safe TypeScript development and CI baseline   | None       |
| 2. Contracts and configuration           | Validated external boundaries and typed failure vocabulary         | Phase 1    |
| 3. Web search tool                       | Bounded, validated Tavily search capability                        | Phase 2    |
| 4. Safe page reader                      | SSRF-resistant textual page retrieval                              | Phase 2    |
| 5. Research agent and grounding          | Restricted ReAct agent producing source-grounded structured briefs | Phases 3–4 |
| 6. Memory and HTTP service               | Isolated sessions and complete HTTP API behavior                   | Phase 5    |
| 7. Production controls and observability | Authenticated, bounded, diagnosable service                        | Phase 6    |
| 8. Deployment, evaluation, and release   | Reproducible container deployment and acceptance evidence          | Phase 7    |

## Phase 1: Project foundations

**Outcome:** The repository builds and tests reproducibly on the required runtime without committing package credentials or application secrets.

**Depends on:** None.

**Requirements:** §4.1, §4.2, SEC-4, §10.1, §11, §15.

### Tasks

- [x] 1.1 Pin Node.js 24 and npm 9+ expectations and create TypeScript 7 build, prettier/eslint/eslint-plugin-llm-core lint and formatting, vitest test, and start commands that succeed on a minimal service entry point.
- [x] 1.2 Add a token-free GitHub Packages configuration for the `@cadmusgroup-llc` scope and document local `read:packages` authentication without storing a literal token.
- [x] 1.3 Add ignore rules for credential-bearing local npm configuration, `.env` files, dependencies, build output, test output, and coverage.
- [x] 1.4 Add environment parsing tests that fail for missing or malformed required values and verify error output contains no secret values.
- [x] 1.5 Implement the smallest Zod-backed environment loader that passes those tests and distinguishes local optional configuration from production-required secrets.
- [x] 1.6 Add CI jobs that install from the lockfile and run type checking, linting, unit tests, and the production build with package credentials injected as secrets.
- [x] 1.7 Pin CG AgentFlow package versions used by the project and record any documentation/package discrepancy that requires an integration test.

### Exit criteria

- A clean checkout can install, type-check, lint, test, and build through documented commands on Node.js 24.
- Repository and CI configuration contain no literal package or provider credentials.
- A deliberately invalid environment fails with a clear, redacted validation error.

## Phase 2: Contracts and configuration

**Outcome:** Every API, tool, provider, and model-output boundary has a validated schema and stable typed failure contract before external integrations are added.

**Depends on:** Phase 1.

**Requirements:** §4.1, §4.3, FR-1, FR-2, FR-3, FR-4, FR-8, §8, §11.1.

### Tasks

- [ ] 2.1 Add failing tests for topic trimming, empty topics, the 300-character limit, optional session IDs, generated-session behavior, and request-body shape.
- [ ] 2.2 Implement the request schema and normalization helpers needed to pass the request-contract tests.
- [ ] 2.3 Add failing tests for the structured research response: normalized topic, session ID, brief, source list, uncertainty fields, run ID, and 500-word maximum.
- [ ] 2.4 Implement the response and model-output schemas without TypeScript assertion-based acceptance, including a typed invalid-output result.
- [ ] 2.5 Add failing schema tests for bounded search queries/results and single-URL page-reader input/output, including provider payload rejection.
- [ ] 2.6 Implement tool and provider schemas that normalize only the documented fields and reject unsupported external data.
- [ ] 2.7 Define stable internal error categories and add failing tests for their HTTP status/error-code mapping and sanitized public serialization.
- [ ] 2.8 Implement the smallest typed error mapper that passes all mapping and redaction tests.
- [ ] 2.9 Refactor shared schema and error utilities while the complete contract suite remains green.

### Exit criteria

- Contract tests cover every required external-data boundary and pass without real provider calls.
- Invalid structured model output cannot enter the API response through an unchecked assertion.
- Public error serialization excludes stack traces, secrets, raw provider errors, and filesystem paths.

## Phase 3: Bounded web search

**Outcome:** The agent can invoke a read-only `web_search` tool that safely returns normalized Tavily results under explicit limits.

**Depends on:** Phase 2.

**Requirements:** FR-3, SEC-1, SEC-4, §8, §9, §11.1, AC-2.

### Tasks

- [ ] 3.1 Add failing tests around a fake Tavily transport for query validation, five-result default/maximum behavior, normalized fields, timeout, transient-only retry, and malformed responses.
- [ ] 3.2 Add failing tests proving API keys and authentication headers are absent from tool observations, errors, logs, and serialized results.
- [ ] 3.3 Implement the Tavily transport and `web_search` tool with injected dependencies, `TAVILY_API_KEY`, explicit timeout, bounded exponential backoff, and Zod response parsing.
- [ ] 3.4 Emit structured search telemetry containing duration, outcome, result count, and no sensitive request material.
- [ ] 3.5 Refactor transport/tool separation while all fake-provider tests remain green.
- [ ] 3.6 Run and document one manually triggered sandbox Tavily check without placing a live-provider dependency in the default test suite.

### Exit criteria

- The deterministic search suite passes for success, malformed payload, timeout, retryable failure, terminal failure, and redaction cases.
- Search never returns more than five normalized results by default and never exposes credentials.
- A documented manual check demonstrates live Tavily connectivity when credentials are supplied.

## Phase 4: SSRF-resistant page reading

**Outcome:** The agent can read bounded textual content from public HTTP(S) pages without reaching prohibited networks or treating page content as trusted instructions.

**Depends on:** Phase 2.

**Requirements:** FR-4, SEC-2, SEC-3, SEC-4, §8, §9, §11.1, AC-7, AC-8.

### Tasks

- [ ] 4.1 Add failing URL-policy tests for credentials, non-HTTP schemes, malformed hosts, loopback, private, link-local, multicast, reserved, IPv4-mapped IPv6, IPv6, and cloud metadata destinations.
- [ ] 4.2 Implement hostname resolution and address classification that passes every prohibited-destination test without relying on string-only IP checks.
- [ ] 4.3 Add failing fetch tests for DNS rebinding defenses where supported, per-redirect destination revalidation, redirect limits, timeouts, response-size limits, and cancellation.
- [ ] 4.4 Implement an injected page transport that validates the initial and redirected destinations and returns typed, sanitized retrieval failures.
- [ ] 4.5 Add failing parsing tests for supported textual content types, rejected binary content, HTML readability extraction, title/canonical URL fields, script/style removal, and character truncation.
- [ ] 4.6 Implement bounded content handling and readable-text extraction that passes the parser suite before content reaches the model.
- [ ] 4.7 Add failing prompt-injection fixture tests and implement explicit untrusted-content delimiters plus instructions that prohibit following retrieved commands or disclosing secrets.
- [ ] 4.8 Emit sanitized page-read telemetry containing duration, outcome, and destination hostname but not full URLs with sensitive data or complete page text.
- [ ] 4.9 Refactor URL policy, transport, and extraction boundaries while all SSRF and content tests remain green.

### Exit criteria

- SSRF tests pass for IPv4, IPv6, DNS resolution, redirects, credentials, and metadata endpoints.
- Unsupported or oversized responses fail with typed sanitized errors; supported HTML yields bounded readable text.
- Malicious page fixtures cannot alter trusted instructions, reveal secrets, or request an unregistered capability.

## Phase 5: ReAct research agent and source grounding

**Outcome:** A YAML-defined, read-only CG AgentFlow ReAct agent can search, read, and return a validated brief grounded only in observed evidence.

**Depends on:** Phases 3 and 4.

**Requirements:** §4.1, §4.3, FR-2, FR-5, §6, SEC-1, SEC-3, §8, §9, §11.1, §11.2, §14, §15, AC-2, AC-3, AC-4, AC-6, AC-8.

### Tasks

- [ ] 5.1 Add failing YAML validation tests for `react`, explicit Anthropic provider/model configuration, temperature `0.2`, 1,500 output tokens, no more than 15 iterations, bounded observations, and exactly `web_search` plus `read_page`.
- [ ] 5.2 Create the agent YAML and configuration overrides needed to pass the declarative-spec tests without moving representable behavior into application code.
- [ ] 5.3 Add failing factory tests using fake providers to prove `createAgentFromFile` resolves only the two approved tools and rejects unregistered tool calls.
- [ ] 5.4 Implement runtime dependency construction and the tool resolver needed to create the `ReActAgent` through the documented factory.
- [ ] 5.5 Add failing deterministic agent tests for search selection, page-read selection, max-iteration termination, bounded observations, and relevant trace events.
- [ ] 5.6 Implement and verify the bounded reasoning loop configuration through CG AgentFlow behavior rather than a duplicate application loop.
- [ ] 5.7 Add failing source-ledger tests proving final sources are members of URLs observed during the run and fabricated URLs are rejected.
- [ ] 5.8 Implement per-run source tracking, claim-oriented citation guidance, and insufficient/conflicting-evidence behavior.
- [ ] 5.9 Add failing tests for invalid final output and implement one fixed-limit repair path followed by a typed failure.
- [ ] 5.10 Refactor agent assembly and output processing while the deterministic agent and grounding suites remain green.

### Exit criteria

- Fake-provider tests demonstrate tool choice, tool restriction, iteration termination, output bounds, and invalid-output handling.
- Every accepted source is present in the applicable observed-URL ledger, and unsupported evidence produces an explicit limitation.
- The agent configuration—not ad hoc source code—is the source of truth for declarative behavior and hard framework limits.

## Phase 6: Conversation memory and HTTP service

**Outcome:** Callers can use a complete HTTP API with isolated follow-up sessions, health checks, and stable sanitized failures.

**Depends on:** Phase 5.

**Requirements:** FR-1, FR-2, FR-6, FR-7, FR-8, §11.2, §11.3, §14, AC-1, AC-3, AC-4, AC-5, AC-9.

### Tasks

- [ ] 6.1 Add failing memory tests for a YAML-declared sliding window, configurable 50-message default, same-session follow-up context, and cross-session isolation.
- [ ] 6.2 Configure CG AgentFlow memory lifecycle hooks through `createAgentFromFile` and implement an in-memory local `MemoryStore` that passes isolation tests.
- [ ] 6.3 Document restart-from-beginning semantics for interrupted runs and keep exact mid-run checkpoint recovery outside the initial implementation.
- [ ] 6.4 Add failing API tests for valid/invalid `POST /research`, generated and supplied session IDs, normalized topics, structured responses, and run IDs.
- [ ] 6.5 Implement the HTTP research route and request-to-agent integration needed to pass the API contract tests.
- [ ] 6.6 Add failing API tests for every stable error category, status mapping, and forbidden error detail, then connect the typed mapper at the service boundary.
- [ ] 6.7 Add failing tests proving `GET /health` performs no provider call and `GET /ready` checks required configuration/local dependencies without meaningful model cost.
- [ ] 6.8 Implement liveness and readiness routes that pass those no-LLM tests.
- [ ] 6.9 Add graceful-shutdown and in-flight request tests, then implement signal handling and request draining.
- [ ] 6.10 Refactor route and service boundaries while all memory, API, and integration tests remain green.

### Exit criteria

- The API returns a validated brief, session ID, sources, uncertainty information, and run ID for a deterministic research request.
- Same-session follow-ups retain bounded context while different sessions remain isolated.
- Health/readiness make no LLM call, all error categories remain stable and sanitized, and graceful shutdown passes integration tests.

## Phase 7: Production controls and observability

**Outcome:** The public service is authenticated, rate/concurrency bounded, cost/deadline controlled, cancellable, and diagnosable without leaking sensitive content.

**Depends on:** Phase 6.

**Requirements:** SEC-4, SEC-5, §8, §9, §11.2, §11.3, AC-6, AC-10.

### Tasks

- [ ] 7.1 Add failing API-control tests for authentication, per-client rate limits, request-body limits, concurrency/backpressure, security headers, and explicit CORS behavior.
- [ ] 7.2 Implement the public API controls needed to pass those tests and derive client identity from validated authentication rather than arbitrary session IDs.
- [ ] 7.3 Add failing CostGuard tests for per-`run()` `maxCostPerRequest`, `onExceeded: error`, overshoot-aware configuration, and no false claim that agent-instance `maxCostPerSession` is a conversation quota.
- [ ] 7.4 Declare budget policy in agent YAML and verify factory-composed CostGuard hooks stop further model activity at the documented boundary.
- [ ] 7.5 Add failing reliability tests for total request deadlines, retryable-only provider backoff, tool timeouts, bounded outputs, iteration exhaustion, and client-disconnect cancellation.
- [ ] 7.6 Implement deadline/cancellation propagation and bounded retry policies without a broad duplicate-cost retry around the full agent run.
- [ ] 7.7 Add failing observability tests for run, agent, tool, provider, guardrail, budget, timeout, validation, and overall-request events with correlation IDs and privacy-safe session identifiers.
- [ ] 7.8 Implement structured logs, CG AgentFlow tracing, and metrics for rates, latency, failures, iteration exhaustion, token usage, and estimated cost.
- [ ] 7.9 Add redaction tests for prompts, retrieved pages, keys, headers, errors, and traces, then centralize sanitization until all leak tests pass.
- [ ] 7.10 Refactor middleware and lifecycle composition while API-control, reliability, and observability suites remain green.

### Exit criteria

- Unauthenticated, oversized, excessive-rate, and excess-concurrency requests are rejected with stable responses.
- Tests demonstrate hard iteration/token/tool-output controls, request budget enforcement, total deadlines, bounded retries, and cancellation.
- Required logs, traces, and metrics are emitted with correlation while secret and sensitive-content leak tests pass.

## Phase 8: Container deployment, evaluation, and release

**Outcome:** A non-root container can be deployed reproducibly, evaluated against adversarial and quality scenarios, smoke-tested, and rolled back.

**Depends on:** Phase 7.

**Requirements:** FR-6, SEC-2, SEC-4, SEC-5, §9, §10.1, §10.2, §11.4, §12, §15, AC-1–AC-12.

### Tasks

- [ ] 8.1 Add container inspection tests for a multi-stage Node.js 24 build, lockfile installation, non-root runtime, production-only artifacts, configurable `PORT`, and health-check support.
- [ ] 8.2 Implement the Dockerfile using a BuildKit package-token secret so no credential-bearing `.npmrc` or token survives in an image layer.
- [ ] 8.3 Add `.dockerignore` coverage for `.env`, `.git`, dependencies, tests/coverage output, and unrelated development artifacts, then verify the build context excludes them.
- [ ] 8.4 Build the image locally, inspect its user and layers for credential leakage, and run authenticated health and deterministic research smoke tests.
- [ ] 8.5 Configure Railway or a comparable container host with environment secrets, health path, authentication, rate limits, and an appropriate shared persistent `MemoryStore` for multi-replica or restart durability.
- [ ] 8.6 Document local/deployed build and start commands, required variables, memory-store selection, public controls, smoke checks, and rollback procedure.
- [ ] 8.7 Create evaluation fixtures for current events, technical primary sources, disagreement, insufficient/inaccessible evidence, low-quality results, prompt injection, fabricated citations, and same-session follow-up.
- [ ] 8.8 Implement scoring for source validity, claim support, completeness, uncertainty calibration, 500-word compliance, tool efficiency, latency, and cost.
- [ ] 8.9 Run the complete unit, agent, API/integration, security, and evaluation suites through supported repository commands and resolve every failure.
- [ ] 8.10 Run a live-provider acceptance check demonstrating Tavily search plus selected page reads with only tool-observed source URLs in the response.
- [ ] 8.11 Run deployed authenticated health and research smoke tests with secrets supplied only by the hosting platform and record rollback-ready release evidence.
- [ ] 8.12 Review and record evidence for every acceptance criterion before declaring the initial release complete.

### Exit criteria

- The final image runs as non-root, contains no build credential, uses `PORT`, and passes local authenticated smoke tests.
- The deployed instance passes authenticated health/research smoke tests with platform-managed secrets and the documented persistence model.
- All supported test suites and evaluation gates pass, and evidence exists for AC-1 through AC-12.

## Requirement coverage matrix

| Requirement                          | Primary phase(s) |
| ------------------------------------ | ---------------- |
| §4 Framework and runtime             | 1, 2, 5, 7, 8    |
| §4.1 Required stack                  | 1, 2, 5          |
| §4.2 Package registry authentication | 1, 8             |
| §4.3 ReAct configuration             | 2, 5, 7          |
| §5 Functional requirements           | 2–6              |
| FR-1 Research request                | 2, 6             |
| FR-2 Research response               | 2, 5, 6          |
| FR-3 Web search                      | 2, 3             |
| FR-4 Page reading                    | 2, 4             |
| FR-5 Source grounding                | 5, 6             |
| FR-6 Conversation memory             | 6, 8             |
| FR-7 Health endpoints                | 6, 8             |
| FR-8 Error responses                 | 2, 6             |
| §6 Agent behavior                    | 5                |
| §7 Security requirements             | 1, 3–5, 7, 8     |
| SEC-1 Read-only capability boundary  | 3, 5             |
| SEC-2 SSRF protection                | 4, 8             |
| SEC-3 Prompt-injection resistance    | 4, 5             |
| SEC-4 Secrets                        | 1, 3, 4, 7, 8    |
| SEC-5 Public API controls            | 7, 8             |
| §8 Reliability and cost controls     | 2–5, 7           |
| §9 Observability                     | 3–5, 7, 8        |
| §10 Deployment requirements          | 1, 8             |
| §10.1 Container                      | 1, 8             |
| §10.2 Railway or equivalent host     | 8                |
| §11 TDD mandate                      | 1–8              |
| §11.1 Unit tests                     | 2–5              |
| §11.2 Agent tests                    | 5–7              |
| §11.3 API and integration tests      | 6–7              |
| §11.4 Evaluation scenarios           | 8                |

## Acceptance criteria coverage

| Criterion                                                      | Evidence-producing phase(s) |
| -------------------------------------------------------------- | --------------------------- |
| AC-1 Structured research request and response                  | 6, 8                        |
| AC-2 Live Tavily search and selected page reads                | 3–5, 8                      |
| AC-3 Returned URLs observed in run or relevant stored evidence | 5, 6, 8                     |
| AC-4 Brief length and uncertainty/disagreement                 | 2, 5, 8                     |
| AC-5 Follow-up context and session isolation                   | 6, 8                        |
| AC-6 Iteration, time, token, tool-output, and cost bounds      | 5, 7, 8                     |
| AC-7 Complete SSRF test classes                                | 4, 8                        |
| AC-8 Prompt-injection containment                              | 4, 5, 8                     |
| AC-9 No-LLM health and readiness                               | 6, 8                        |
| AC-10 All test and evaluation suites pass                      | 1–8                         |
| AC-11 Non-root container and local smoke test                  | 8                           |
| AC-12 Deployed authenticated smoke tests with platform secrets | 8                           |

## Release rule

The initial release is complete only when every roadmap phase is complete, every phase exit criterion passes, and recorded evidence satisfies all twelve acceptance criteria. If this roadmap and `REQUIREMENTS.md` conflict, `REQUIREMENTS.md` wins and the roadmap must be corrected.
