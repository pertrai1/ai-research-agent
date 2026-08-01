## ADDED Requirements

### Requirement: Per-run budget policy

The agent YAML SHALL declare a CostGuard with a per-run `maxCostPerRequest`
budget and `onExceeded: error`; runtime verification SHALL reject a missing or
incompatible budget before agent creation, and the service SHALL map budget
exhaustion to a stable sanitized failure.

#### Scenario: Budget is reset for each run

- **WHEN** two independent `agent.run()` calls execute on the configured agent
- **THEN** each run receives its own per-run budget enforcement

#### Scenario: Budget exhaustion stops model activity

- **WHEN** the fake provider would exceed the configured per-run budget
- **THEN** CostGuard emits its error behavior, prevents further model activity,
  and the service returns a sanitized budget failure

#### Scenario: Session budget semantics are not overstated

- **WHEN** the service documents or reports cost limits
- **THEN** `maxCostPerSession` is not represented as a per-conversation quota

### Requirement: Deadline and cancellation propagation

Each research request SHALL have a total deadline and SHALL propagate an
AbortSignal to supported agent, provider, and tool operations; client
disconnects SHALL cancel in-flight work and return no sensitive diagnostic
payload.

#### Scenario: Deadline stops a slow run

- **WHEN** research execution exceeds the configured total deadline
- **THEN** the request is cancelled and returns a stable timeout failure

#### Scenario: Client disconnect cancels work

- **WHEN** the client aborts an in-flight research request
- **THEN** the request signal is aborted and the executor/tool stops at its next
  supported cancellation point

### Requirement: Bounded provider and tool reliability

The service SHALL preserve retry-only-transient behavior for provider and tool
operations, SHALL apply per-operation timeouts and output bounds, and SHALL not
retry the full agent run in a way that can duplicate cost.

#### Scenario: Transient operation failure retries within bounds

- **WHEN** an injected provider operation returns a retryable timeout or server
  failure
- **THEN** it retries only within the configured attempt and deadline limits

#### Scenario: Terminal operation failure is not retried

- **WHEN** an operation returns a terminal client or validation failure
- **THEN** it returns the typed failure without another attempt or full-run retry
