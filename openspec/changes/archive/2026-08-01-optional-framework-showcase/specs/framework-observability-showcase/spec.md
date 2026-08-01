## ADDED Requirements

### Requirement: Opt-in sanitized framework tracing

The showcase SHALL provide a local/demo tracing profile that wires CG AgentFlow lifecycle tracing to an in-memory sanitized exporter and is disabled unless explicitly requested.

#### Scenario: Default service tracing remains disabled

- **WHEN** the production research agent is created without showcase options
- **THEN** no showcase exporter is registered and the existing project telemetry path remains the only service-level observability path

#### Scenario: Opt-in tracing emits bounded span summaries

- **WHEN** a caller creates the showcase tracing profile and emits framework lifecycle events
- **THEN** the exporter records span names, status, bounded timing, correlation IDs, and allow-listed scalar metadata for local inspection

### Requirement: Showcase traces do not contain sensitive content

The sanitized exporter SHALL omit prompts, retrieved page text, full URLs, secrets, authentication headers, raw provider errors, and arbitrary event payloads.

#### Scenario: Sensitive attributes are dropped

- **WHEN** a span contains prompt, page, URL, token, header, or error-content attributes
- **THEN** the recorded summary contains none of those values and retains only the approved bounded metadata
