## 1. Conversation memory

- [x] 1.1 Add failing tests for the YAML-declared sliding window, configurable 50-message default, same-session follow-up context, cross-session isolation, and empty-after-restart behavior.
- [x] 1.2 Add the memory configuration to the research-agent YAML and implement the typed in-memory `MemoryStore` with per-session sliding-window bounds.
- [x] 1.3 Inspect the installed AgentFlow declarations, wire supported memory lifecycle hooks through `createAgentFromFile`, and add an integration test proving the store is used without broadening the approved tool list.
- [x] 1.4 Document process-local restart-from-beginning semantics and explicitly defer exact mid-run checkpoint recovery.

## 2. HTTP research service

- [x] 2.1 Add failing HTTP service tests for valid and invalid `POST /research`, generated and supplied session IDs, normalized topics, structured responses, and run IDs using an injected deterministic agent.
- [x] 2.2 Implement the HTTP request parser/dispatcher and connect the research route to the Phase 5 agent runner and session memory.
- [x] 2.3 Add failing tests for every stable error category at the service boundary, including redaction of raw errors, secrets, stacks, and filesystem paths.
- [x] 2.4 Implement service-boundary error mapping and bounded request-body handling.

## 3. Health and lifecycle

- [x] 3.1 Add failing tests proving `/health` makes no provider call and `/ready` checks configuration/local dependencies without meaningful model cost.
- [x] 3.2 Implement liveness/readiness routes and response serialization.
- [x] 3.3 Add failing graceful-shutdown and in-flight request-drain tests, then implement signal/server lifecycle handling with restart semantics.

## 4. Integration and gates

- [x] 4.1 Refactor route, memory, and agent assembly boundaries while all focused tests remain green.
- [x] 4.2 Update Phase 6 roadmap status and implementation documentation only after the exit criteria are demonstrated.
- [x] 4.3 Run strict OpenSpec validation, formatting, lint, typecheck, deterministic tests, and production build; record verification evidence.
