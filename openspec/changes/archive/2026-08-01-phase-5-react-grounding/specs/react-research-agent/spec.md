## ADDED Requirements

### Requirement: Declarative bounded ReAct configuration

The agent specification SHALL define a `react` agent with an explicit Anthropic provider, configurable model, temperature `0.2`, maximum output tokens `1500`, no more than `15` iterations, bounded tool observations, and exactly the `web_search` and `read_page` tools.

#### Scenario: Valid specification passes validation

- **WHEN** the repository loads the Phase 5 YAML specification with valid configuration overrides
- **THEN** validation succeeds and exposes the required agent type, provider, defaults, bounds, observation limit, and exact two-tool allow-list

#### Scenario: Unsafe or incomplete specification is rejected

- **WHEN** the specification omits a required field, exceeds an iteration/token bound, uses another provider, or names a third tool
- **THEN** validation fails with a sanitized configuration error before agent creation

### Requirement: Restricted factory assembly

The runtime SHALL create the ReAct agent through `createAgentFromFile`, resolve only validated `web_search` and `read_page` implementations, and reject unregistered tool calls without executing them.

#### Scenario: Approved tools resolve

- **WHEN** the factory requests either approved tool by name
- **THEN** the corresponding injected tool is returned and can execute through its validated boundary

#### Scenario: Unregistered capability is refused

- **WHEN** the factory or provider requests a file, shell, code-execution, publishing, or unknown tool
- **THEN** resolution fails with a typed sanitized error and no tool side effect occurs

### Requirement: Bounded deterministic agent behavior

The agent SHALL use framework-configured ReAct behavior to select search and page-reading tools, terminate at the configured iteration limit, bound observations, and emit relevant sanitized run, agent, tool, provider, and termination trace events.

#### Scenario: Research uses search and page reading

- **WHEN** a fake provider requests a search and then a page read for a topic
- **THEN** the agent returns a validated brief and the trace records both approved tool outcomes without exposing credentials or complete page text

#### Scenario: Iteration and observation bounds hold

- **WHEN** a fake provider continues requesting work or a tool returns oversized content
- **THEN** the framework terminates at the configured limit and each model observation remains within the configured bound

### Requirement: Source-ledger grounding

The runner SHALL maintain a per-run set of validated URLs observed from successful tool results and SHALL accept final sources only when each URL belongs to that set.

#### Scenario: Observed citation is accepted

- **WHEN** the final structured output cites a URL returned by `web_search` or `read_page` during the same run
- **THEN** the source remains in the validated response

#### Scenario: Fabricated citation is rejected

- **WHEN** the final structured output cites a URL not present in the current run's observed ledger
- **THEN** the output is rejected or repaired and cannot become a successful response with that URL

#### Scenario: Evidence is insufficient or conflicting

- **WHEN** tool evidence cannot establish a claim or validated sources disagree
- **THEN** the final response states the limitation in its uncertainty field instead of inventing support

### Requirement: Fixed-limit output validation and repair

The runner SHALL validate structured model output at the existing response boundary, attempt at most one bounded repair for invalid output, and return a typed `INVALID_AGENT_OUTPUT` failure if repair remains invalid.

#### Scenario: One repair succeeds

- **WHEN** the first model output is malformed but the single repair output is valid and grounded
- **THEN** the runner returns the repaired validated response

#### Scenario: Repair limit is exhausted

- **WHEN** both the initial and repair outputs are invalid or ungrounded
- **THEN** the runner returns `INVALID_AGENT_OUTPUT` without an unbounded retry loop
