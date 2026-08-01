## Why

The service already uses CG AgentFlow for its core agent, but the optional roadmap tracks do not yet demonstrate the framework's guardrail, tracing, and evaluation surfaces. Adding opt-in showcase support now makes those capabilities executable and reviewable without weakening the service's existing application-level grounding, redaction, correlation, and read-only controls.

## What Changes

- Add a YAML-backed guardrail showcase that resolves only the framework guardrails required for prompt-injection checks, secret redaction, and output validation.
- Add an opt-in local/demo tracing profile with a sanitized exporter boundary and explicit protection against prompts, URLs, retrieved content, and secrets entering showcase traces.
- Add a deterministic, test-only evaluation harness using framework datasets, `EvalRunner`, evaluators, reports, and regression detection, plus project evaluators for grounding, brief length, uncertainty, and prompt-injection containment.
- Keep live-provider evaluation opt-in and preserve the production service's existing telemetry, source ledger, response validation, and tool allow-list as authoritative controls.

## Capabilities

### New Capabilities

- `framework-guardrail-showcase`: Opt-in YAML guardrail resolution and deterministic guardrail behavior demonstration.
- `framework-observability-showcase`: Opt-in sanitized framework tracing profile for local/demo use.
- `framework-evaluation-harness`: Test-only deterministic evaluation datasets, evaluators, reports, and regression checks.

### Modified Capabilities

- None. The showcase adds optional demonstrations without changing the required service behavior or existing capability contracts.

## Impact

- Adds showcase configuration, framework adapters, test-only evaluation utilities, and focused deterministic tests.
- Touches the AgentFlow assembly/configuration seam and package exports only as needed for the optional adapters.
- Adds no HTTP routes, provider defaults, write-capable tools, framework retries, persistent storage, or production tracing behavior.
