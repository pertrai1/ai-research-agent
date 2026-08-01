## Context

The required service already creates a YAML-defined ReAct agent through `createAgentFromFile`, uses exactly `web_search` and `read_page`, tracks observed URLs, and emits project-owned sanitized telemetry. CG AgentFlow 0.17.1 also exposes deterministic guardrails, tracing hooks/exporters, and an evaluation package, but these surfaces are not currently demonstrated. The installed declarations are the primary framework contract because the package is private and Context7 has no matching documentation.

## Goals / Non-Goals

**Goals:**

- Add a separate showcase YAML spec and resolver that exercise the three deterministic guardrails through the factory.
- Make tracing opt-in through a dedicated sanitized exporter/profile that accepts only bounded, non-sensitive span metadata.
- Provide a deterministic test-only evaluation harness using the installed dataset, evaluator registry, `EvalRunner`, report, and regression APIs.
- Keep framework integration isolated from the production request path and preserve application-level controls as defense in depth.

**Non-Goals:**

- Changing the production agent YAML, HTTP API, public response contract, source-ledger policy, or approved tool list.
- Enabling tracing or live-provider evaluations by default.
- Persisting evaluation reports, sending telemetry to external services, adding retries, or replacing service telemetry/memory.

## Decisions

1. **Use a dedicated showcase agent spec and adapter.** The default production spec remains unchanged; `createShowcaseAgent` loads the showcase YAML and supplies both the existing tool resolver and an explicit allow-listed guardrail resolver. This isolates optional behavior while proving factory wiring.

2. **Resolve only three deterministic guardrails.** `prompt-injection` is input-only, while `secrets-redaction` and `output-validation` are output-only. Unknown types and direction mismatches resolve to `undefined`, causing an explicit validation failure in the adapter rather than silently expanding capabilities.

3. **Use an in-memory sanitized exporter for tracing.** The exporter records bounded span summaries for tests/demo inspection, retaining names, status, timing, IDs, and a small allow-list of scalar attributes. It drops event payloads and all prompt, URL, page, header, credential, and error-content fields. No external exporter is configured.

4. **Wrap framework evaluation with project evaluators.** The harness registers the framework reasoning, tool-selection, and answer evaluators plus project evaluators for observed URL membership, the 500-word brief limit, uncertainty presence, and injection containment. The agent factory is injected, so tests use deterministic fake agents and no provider calls.

5. **Detect regressions only on compatible reports.** Baseline and candidate reports must share dataset identity; the framework's `detectRegressions` is used with a documented score-drop threshold. Evaluation helpers return typed results and do not write files.

## Risks / Trade-offs

- [Framework guardrail semantics may differ from application validation] → Keep application delimiting, grounding, output parsing, and redaction authoritative; tests demonstrate only defense-in-depth behavior.
- [Trace sanitization could miss a sensitive attribute] → Use an allow-list projection, drop all events, bound strings/numbers, and test representative prompts, URLs, page text, keys, headers, and errors.
- [Evaluation API may be incomplete or incompatible with the private package] → Pin 0.17.1, compile against installed declarations, use fake agents, and record any confirmed discrepancy in `docs/agent-flow-findings.md`.
- [Showcase accidentally becomes production behavior] → Keep files under showcase/test support, use a separate YAML spec, and leave production tracing disabled.

## Migration Plan

Add the showcase files and deterministic tests. Consumers can opt in by importing the showcase adapter or running the dedicated test command; no migration or persisted state is required. Rollback is removal of the showcase files and change artifacts.

## Open Questions

None blocking implementation. The exact framework evaluator trace shape will be adapted at the injected fake-agent seam and covered by tests.
