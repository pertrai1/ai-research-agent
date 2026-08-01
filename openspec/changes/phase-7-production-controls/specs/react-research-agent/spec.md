## MODIFIED Requirements

### Requirement: Declarative bounded ReAct configuration

The agent specification SHALL define a `react` agent with an explicit
Anthropic provider, configurable model, temperature `0.2`, maximum output
tokens `1500`, no more than `15` iterations, bounded tool observations, a
per-run CostGuard with `maxCostPerRequest` and `onExceeded: error`, and exactly
the `web_search` and `read_page` tools.

#### Scenario: Valid specification passes validation

- **WHEN** the repository loads the Phase 7 YAML specification with valid
  configuration overrides
- **THEN** validation succeeds and exposes the required agent type, provider,
  defaults, bounds, budget policy, observation limit, and exact two-tool
  allow-list

#### Scenario: Unsafe or incomplete specification is rejected

- **WHEN** the specification omits a required field, exceeds an
  iteration/token/budget bound, uses another provider, names a third tool, or
  omits CostGuard error behavior
- **THEN** validation fails with a sanitized configuration error before agent
  creation

### Requirement: Restricted factory assembly

The runtime SHALL create the ReAct agent through `createAgentFromFile`, resolve
only validated `web_search` and `read_page` implementations, and reject
unregistered tool calls without executing them.

#### Scenario: Approved tools resolve

- **WHEN** the factory requests either approved tool by name
- **THEN** the corresponding injected tool is returned and can execute through
  its validated boundary

#### Scenario: Unregistered capability is refused

- **WHEN** the factory or provider requests a file, shell, code-execution,
  publishing, or unknown tool
- **THEN** resolution fails with a typed sanitized error and no tool side effect
  occurs
