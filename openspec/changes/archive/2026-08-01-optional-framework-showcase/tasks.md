## 1. Guardrail showcase

- [x] 1.1 Add a dedicated showcase YAML spec declaring the approved deterministic input/output guardrails, fail-fast mode, existing read-only tools, and disabled tracing by default.
- [x] 1.2 Add failing tests for guardrail config validation, resolver allow-list/direction checks, injection blocking, secret redaction, and output validation.
- [x] 1.3 Implement the typed showcase guardrail resolver and factory adapter using `createAgentFromFile`, preserving the existing tool resolver and production agent path.
- [x] 1.4 Run the guardrail tests and typecheck; record any confirmed AgentFlow package discrepancy in `docs/agent-flow-findings.md`.

## 2. Sanitized observability showcase

- [x] 2.1 Add failing tests for opt-in tracing, bounded span summaries, correlation metadata, and removal of prompts, URLs, page text, secrets, headers, errors, and event payloads.
- [x] 2.2 Implement the in-memory allow-list sanitized exporter/profile and tracing-hook adapter with no external exporter or default activation.
- [x] 2.3 Run focused tracing tests and verify the production service remains tracing-disabled and its existing telemetry path is unchanged.

## 3. Evaluation harness

- [x] 3.1 Add failing tests for validated deterministic datasets, framework evaluator registration, fake-agent `EvalRunner` execution, and no live-provider/network calls.
- [x] 3.2 Implement test-only/project evaluator adapters for observed URL grounding, 500-word limit, uncertainty, and prompt-injection containment.
- [x] 3.3 Add baseline/candidate regression detection using the framework API with a bounded threshold and no report persistence.
- [x] 3.4 Run focused evaluation tests and document any package incompatibility or workaround.

## 4. Integration and gates

- [x] 4.1 Add concise showcase usage documentation and ensure no production configuration or HTTP contract changes are required.
- [x] 4.2 Validate OpenSpec artifacts and run formatting, lint, typecheck, deterministic tests, and production build.
