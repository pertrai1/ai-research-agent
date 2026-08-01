## Why

Phases 3 and 4 provide safe search and page-reading primitives, but the repository has no agent that composes them into the promised source-grounded research behavior. Phase 5 is needed now to establish the framework integration, strict read-only tool boundary, bounded ReAct execution, and evidence ledger before the HTTP and memory work in Phase 6.

## What Changes

- Add a validated YAML agent specification for a `react` agent with explicit Anthropic configuration, bounded model output, bounded iterations, bounded observations, and only `web_search` and `read_page`.
- Add runtime dependency construction and the documented `createAgentFromFile` integration, using injected tool implementations and fake-provider seams for deterministic tests.
- Add source-ledger processing so accepted citations can only reference URLs observed from tool results during the current run.
- Add claim-oriented grounding instructions and explicit insufficient/conflicting-evidence behavior.
- Add fixed-limit invalid-output repair and typed failure handling.
- Add deterministic tests covering configuration, tool restriction, agent behavior, bounds, traces, grounding, and invalid output.

## Capabilities

### New Capabilities

- `react-research-agent`: YAML-defined, bounded, read-only research-agent assembly and source-grounded output processing.

### Modified Capabilities

- None.

## Impact

- Adds agent configuration under the repository's configuration/specification area and TypeScript assembly/output-processing modules under `src/`.
- Uses the pinned CG AgentFlow package family already present in `package.json`; no new runtime dependency is required.
- Extends the deterministic Vitest suite with fake providers and transports. No live Anthropic or Tavily calls are introduced into the default tests.
- Establishes the agent seam that Phase 6 will call from the HTTP service; it does not implement HTTP routes or conversation memory.
