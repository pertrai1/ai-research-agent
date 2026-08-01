## ADDED Requirements

### Requirement: Bounded session memory

The system SHALL declare a sliding-window memory policy in the agent YAML with a configurable message limit defaulting to 50, and SHALL expose an in-memory `MemoryStore` that retains only the most recent messages for each session.

#### Scenario: Default window bounds messages

- **WHEN** a session appends more than 50 messages using the default configuration
- **THEN** reading that session returns exactly its most recent 50 messages in order

#### Scenario: Configured window is honored

- **WHEN** the memory configuration sets a valid lower message limit
- **THEN** each session retains no more than that configured number of messages

### Requirement: Session context and isolation

The system SHALL associate memory operations with the validated session ID and SHALL provide prior bounded context to a follow-up run in the same session without exposing messages from another session.

#### Scenario: Same-session follow-up sees context

- **WHEN** a caller completes one research request and submits a follow-up with the same session ID
- **THEN** the follow-up runner receives the bounded prior session context

#### Scenario: Different sessions remain isolated

- **WHEN** two sessions append distinct messages and one session is read
- **THEN** the result contains only messages belonging to the requested session

### Requirement: Restart semantics

The system SHALL treat in-memory memory as process-local and SHALL document that an interrupted run restarts from the beginning after process restart; exact mid-run checkpoint recovery SHALL NOT be promised.

#### Scenario: Restart loses local context

- **WHEN** a new store is created after process restart
- **THEN** it contains no messages from the prior process and a new run begins without checkpoint state
