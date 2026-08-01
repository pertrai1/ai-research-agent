## Context

The repository currently exposes validated `web_search` and `read_page` tools, but no CG AgentFlow agent. Phase 5 must integrate the pinned private framework without guessing undocumented APIs, preserve the read-only boundary, and leave a clean seam for Phase 6's HTTP service. The YAML specification is authoritative for behavior expressible by AgentFlow; application code may construct dependencies, resolve the approved tools, track run evidence, and validate the final contract.

## Goals / Non-Goals

**Goals:**

- Validate and load a YAML `react` specification with explicit Anthropic provider/model settings and hard bounds.
- Construct an agent through `createAgentFromFile` with exactly the existing `web_search` and `read_page` tools.
- Provide deterministic fake-provider/fake-tool seams for factory and behavior tests.
- Keep a per-run observed URL ledger and validate model citations against it.
- Delimit retrieved content as untrusted evidence and support one bounded output-repair attempt.

**Non-Goals:**

- HTTP routing, session memory, authentication, rate limits, deployment, or live-provider acceptance testing.
- Reimplementing AgentFlow's ReAct loop, iteration control, memory, tracing, or cost controls in application code.
- Adding any capability beyond `web_search` and `read_page`.

## Decisions

1. **Use the installed factory API as the integration contract.** Inspect the installed package declarations/source and write an integration test around `createAgentFromFile`; do not infer the API from public look-alikes. A small adapter isolates private framework types from the rest of the application.

2. **Keep declarative policy in YAML.** The YAML contains agent type, provider/model, temperature, maximum tokens, iteration/observation bounds, system grounding instructions, and the exact tool names. Runtime overrides are limited to environment-selected provider/model values supported by the factory and injected dependencies.

3. **Resolve tools through an allow-listed map.** The resolver exposes only the two tool names and returns a typed failure for every other name. Tests assert both successful resolution and rejection, rather than relying only on YAML inspection.

4. **Track evidence at the tool boundary.** A per-run wrapper records only validated HTTP(S) URLs from successful search results and page-reader requested/final URLs. Final model output is parsed through the existing response contract and accepted only when every source URL is in the ledger; unsupported or conflicting evidence is represented in `uncertainty`.

5. **Repair once, then fail typed.** Invalid structured output receives one fixed repair instruction through the agent/factory seam. A second invalid result becomes `INVALID_AGENT_OUTPUT`; no unbounded repair or full-run retry is added.

## Risks / Trade-offs

- [Private framework API mismatch] → Pin the existing version, inspect declarations, and make the factory integration test a Phase 5 gate; record confirmed package discrepancies in `docs/agent-flow-findings.md`.
- [Model-generated citations bypass grounding] → Validate every final URL against the per-run ledger and reject fabricated URLs.
- [Retrieved prompt injection] → Put page text in explicit untrusted-evidence delimiters and include non-negotiable system instructions in YAML.
- [Framework behavior is difficult to make deterministic] → Use fake providers/transports and assert observable tool selection, bounds, termination, and trace events at the adapter seam.
- [YAML parser/schema drift] → Validate the parsed configuration before factory invocation and test all required fields and exact tool allow-list.

## Migration Plan

Add the configuration and adapter without changing the existing public HTTP surface (which does not yet exist). Run deterministic tests and project gates. Phase 6 will call the exported research-agent runner and add session/API lifecycle around it. Rollback is removal/revert of the Phase 5 files; no persisted data or external state is changed.

## Open Questions

- The exact supported Claude model default is determined from the installed AgentFlow/provider declarations and environment configuration during implementation; the YAML must remain overrideable without source edits.
