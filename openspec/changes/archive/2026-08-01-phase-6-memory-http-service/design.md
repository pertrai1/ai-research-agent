## Context

The Phase 5 agent is assembled from YAML and accepts injected search/page tools, but `src/index.ts` only starts a foundation process. The existing Zod contracts and public error mapper provide the service boundary primitives; the design must add memory, HTTP orchestration, and lifecycle control without moving declarative agent behavior into ad hoc application code.

## Goals / Non-Goals

**Goals:**

- Keep conversation state in a bounded, in-memory store keyed by validated session ID.
- Configure memory through the agent YAML and pass lifecycle dependencies through the AgentFlow factory where its installed API supports them.
- Provide a small Node `http` server with validated `/research`, provider-free `/health`, and local/configuration-only `/ready` routes.
- Preserve typed, sanitized errors and drain in-flight requests during shutdown.

**Non-Goals:**

- Persistent or distributed memory, exact mid-run checkpoint recovery, authentication, rate limits, cost controls, or observability controls reserved for Phase 7.
- New agent tools, live-provider calls in deterministic tests, or a duplicate reasoning loop.

## Decisions

- **Use a dedicated `MemoryStore` interface with a local implementation.** A small `get/append/clear` contract keeps session isolation testable and leaves a later shared store replaceable. A global unbounded array is rejected because it violates the 50-message bound and isolation requirement.
- **Apply a YAML-declared sliding window with a configurable default of 50 messages.** The YAML remains the source of truth for declarative memory policy; the application supplies the store and lifecycle hooks. Hard-coding the policy in the route would duplicate agent configuration.
- **Use Node's built-in `http` module.** It avoids a new dependency and is sufficient for the three routes, bounded request bodies, response serialization, and connection lifecycle. A framework adapter is deferred until production controls require middleware composition.
- **Inject an agent runner into the HTTP service.** Tests can provide deterministic runners while production assembly connects `createResearchAgent`; this keeps HTTP tests offline and separates transport errors from provider behavior.
- **Drain requests with an explicit server lifecycle.** On shutdown, stop accepting new connections, wait for tracked handlers to settle, then close the server; interrupted runs are abandoned and restart from the beginning.

## Risks / Trade-offs

- [AgentFlow memory hook API may differ from assumptions] → inspect installed package declarations and add a focused integration test; keep the local store behind an adapter.
- [In-memory state disappears on process restart] → document restart-from-beginning semantics and defer persistence to the deployment phase.
- [Unbounded request bodies or hanging handlers] → enforce a body limit and use request/response tracking with shutdown timeout behavior.
- [Readiness could accidentally invoke the model] → make readiness inspect environment and injected local dependencies only, with explicit no-call tests.

## Migration Plan

No data migration is required. Start the new server entry point locally, use the documented routes, and roll back by restoring the previous entry point if integration gates fail. Existing contracts and tools remain compatible.

## Open Questions

- Confirm the exact installed AgentFlow memory lifecycle hook names and adapt only the integration seam if package declarations differ.
