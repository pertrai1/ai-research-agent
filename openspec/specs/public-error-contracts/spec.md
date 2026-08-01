## Purpose

Define stable public error mappings that keep provider and implementation
details out of API responses.

## Requirements

### Requirement: Stable public error contract

The system SHALL map the defined invalid-request, authentication, rate-limit,
search-provider, page-rejection/page-failure, LLM-provider, budget/iteration,
invalid-agent-output, and internal categories to stable HTTP statuses and error
codes. Public serialization SHALL contain only the mapped code and static
message.

#### Scenario: Typed error maps predictably

- **WHEN** an internal error category is serialized for an API response
- **THEN** it has its documented HTTP status, stable code, and static message

#### Scenario: Sensitive implementation detail is excluded

- **WHEN** a typed error has a stack trace, secret, raw provider message, or filesystem path in attached context
- **THEN** its public serialization exposes none of that attached context
