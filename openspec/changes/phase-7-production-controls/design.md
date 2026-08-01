## Context

The Phase 6 service accepts arbitrary callers and invokes a YAML-driven
AgentFlow ReAct run through a process-local executor. Retrieval tools already
have individual bounds and transient retry policies, but the HTTP lifecycle
does not yet impose an authenticated caller identity, admission controls,
deadline/cancellation context, or a single privacy-safe diagnostic surface.
AgentFlow 0.17.1 is installed locally; its CostGuard and observability APIs
must be verified against the package sources and covered by integration tests.

## Goals / Non-Goals

**Goals:**

- Protect public research and readiness routes with validated API keys.
- Bound body size, request rate, active work, total duration, retries, and
  per-run cost while preserving the existing read-only tool allow-list.
- Propagate cancellation from disconnects and deadlines to agent/tool calls.
- Emit correlated, structured lifecycle events and privacy-safe aggregate
  metrics.
- Keep all secrets, prompts, page text, headers, and raw provider failures out
  of responses, logs, traces, and metrics.

**Non-Goals:**

- Durable distributed rate-limit or usage accounting; Phase 7 uses an injected
  process-local policy, with a durable store deferred to deployment work.
- Browser access by default; CORS is explicit and disabled unless configured.
- A broad retry around a complete agent run.
- Container, hosting, evaluation, or release changes assigned to Phase 8.

## Decisions

- **Use an injected HTTP control policy.** Authentication, token-bucket rate
  limiting, concurrency admission, body limits, CORS, headers, and deadline
  values are supplied as options with safe defaults. This keeps the Node HTTP
  boundary testable and avoids a framework migration. A middleware framework
  was rejected because it would expand dependencies without solving the
  process-local deployment limitation; a single monolithic handler was
  rejected because controls would be difficult to test independently.
- **Derive identity only from API-key validation.** The validated key maps to a
  stable privacy-safe client identifier; session IDs remain conversation
  identifiers and cannot affect admission quotas. JWT/OIDC was rejected for
  this release because there is no issuer/key configuration requirement in the
  product contract; an IP-only identity was rejected as spoofable and shared.
- **Use request-scoped AbortSignals.** A deadline controller is combined with
  the request's close/aborted events and passed through the executor contract,
  agent run options where supported, and injected tool transports. This
  preserves cancellation without introducing a duplicate full-run retry loop.
- **Declare CostGuard in YAML and compose hooks at factory creation.** The
  YAML is authoritative for the budget and `onExceeded: error`; runtime code
  verifies the loaded policy and adds request correlation hooks. The API
  reports budget exhaustion as a stable error, and documentation/tests do not
  describe `maxCostPerSession` as a conversation quota.
- **Centralize event sanitization before sinks.** A small typed event/metrics
  module accepts allow-listed scalar fields, hashes session/client identifiers,
  truncates free-form error labels, and drops prompt/page/header/key fields.
  Structured console logging and an in-memory metrics sink use the same
  sanitized event path; full OpenTelemetry export is not required for this
  phase.

## Risks / Trade-offs

- [Process-local controls do not coordinate replicas] → document the limit and
  keep the policy interface replaceable for Phase 8's shared store.
- [CostGuard checks before a model call and may overshoot by one call] → set a
  margin below the desired hard ceiling and retain token/iteration limits;
  verify the installed behavior with a fake provider.
- [Node fetch cannot guarantee socket-level DNS pinning] → preserve Phase 4's
  SSRF checks and cancellation, and leave network-policy hardening to
  deployment.
- [Disconnect events can race with a completed response] → make cancellation
  idempotent and ensure response writes are guarded by `headersSent`.
- [Diagnostic fields can become sensitive as dependencies evolve] → use
  allow-listed event schemas and leak tests rather than serializing arbitrary
  dependency objects.

## Migration Plan

1. Add deterministic contract/control tests and the YAML budget declaration.
2. Implement policy, request context, cancellation, telemetry, and metrics
   seams without changing provider defaults.
3. Wire the production entry point with environment-configured API key and
   control values; local/test callers use explicit test options.
4. Run all existing and new gates. Rollback is a branch/release rollback; no
   persistent schema migration is introduced.

## Open Questions

- The private CG AgentFlow documentation is not indexed by Context7. The
  installed 0.17.1 package sources are the authoritative local evidence, and
  any mismatch with the published baseline will be recorded in
  `docs/agent-flow-findings.md` with an integration test.
