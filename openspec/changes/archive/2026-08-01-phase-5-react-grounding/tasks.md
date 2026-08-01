## 1. Configuration and contracts

- [x] 1.1 Inspect the installed CG AgentFlow 0.17.1 declarations/source for `createAgentFromFile`, provider/model configuration, tool resolver, run result, and trace interfaces; record any confirmed discrepancy in `docs/agent-flow-findings.md`.
- [x] 1.2 Add failing YAML/configuration tests for `react`, Anthropic, configurable model, temperature `0.2`, 1,500 output tokens, maximum 15 iterations, bounded observations, and the exact two-tool allow-list.
- [x] 1.3 Add the YAML agent specification and validated configuration loader/overrides, keeping declarative behavior and hard limits in the spec.

## 2. Factory and read-only tool boundary

- [x] 2.1 Add failing fake-provider factory tests proving `createAgentFromFile` resolves only injected `web_search` and `read_page` tools and rejects unregistered tool calls without execution.
- [x] 2.2 Implement runtime dependency construction, the explicit approved-tool resolver, and the Phase 5 agent assembly adapter.
- [x] 2.3 Add failing tests for deterministic search/page-read selection, bounded observations, iteration termination, and sanitized run/agent/tool/provider/termination trace events.
- [x] 2.4 Implement the adapter wiring so framework-configured ReAct behavior supplies those bounds and traces without a duplicate application reasoning loop.

## 3. Grounded output and repair

- [x] 3.1 Add failing source-ledger tests for observed search/page URLs, same-run membership, fabricated URL rejection, and insufficient/conflicting evidence uncertainty.
- [x] 3.2 Implement per-run URL tracking, claim-oriented grounding guidance, and validated final source projection.
- [x] 3.3 Add failing tests for one successful invalid-output repair and typed failure after the fixed repair limit.
- [x] 3.4 Implement the single repair path and `INVALID_AGENT_OUTPUT` failure mapping without broad run retries.

## 4. Refactor and verification

- [x] 4.1 Refactor agent assembly, tool resolution, evidence tracking, and output processing while the focused Phase 5 suites remain green.
- [x] 4.2 Run strict OpenSpec validation and produce the required verification summary covering functional, test, integration, boundary, and scope evidence.
- [x] 4.3 Run typecheck, lint, format check, full deterministic tests, and production build; confirm no live provider calls occur in the default suite.
