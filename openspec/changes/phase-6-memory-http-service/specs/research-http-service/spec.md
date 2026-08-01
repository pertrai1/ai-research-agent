## ADDED Requirements

### Requirement: Research HTTP endpoint

The system SHALL expose `POST /research` that parses the existing strict request contract, generates or preserves a session ID, invokes the research agent with that session context, and returns the validated structured response including topic, brief, sources, uncertainty, session ID, and run ID.

#### Scenario: Valid research request succeeds

- **WHEN** a caller posts a valid JSON topic without a session ID and the deterministic agent returns a valid result
- **THEN** the service returns the normalized topic, generated session ID, structured brief, sources, uncertainty, and run ID

#### Scenario: Supplied session ID is preserved

- **WHEN** a caller posts a valid topic with a valid session ID
- **THEN** the response uses that same session ID and the agent receives the session's bounded context

#### Scenario: Invalid research request is rejected

- **WHEN** the body is empty, malformed, oversized, or violates the request schema
- **THEN** the service returns the stable invalid-request error response without invoking the agent

### Requirement: Stable sanitized service failures

The system SHALL map request, agent, provider, invalid-output, and unexpected failures through the existing public error mapper and SHALL omit raw errors, stacks, secrets, filesystem paths, and provider payloads from responses.

#### Scenario: Typed agent failure maps publicly

- **WHEN** the agent returns a typed provider or invalid-output failure
- **THEN** the service returns its documented status and static error code/message only

#### Scenario: Unexpected failure is sanitized

- **WHEN** a route dependency throws an error containing sensitive internal details
- **THEN** the service returns only the stable internal-error response body

### Requirement: Provider-free liveness and readiness

The system SHALL expose `GET /health` as a provider-free liveness check and `GET /ready` as a check of required configuration and local dependencies, and neither endpoint SHALL invoke the language model or external providers.

#### Scenario: Health is live without credentials

- **WHEN** a caller requests `/health` in local mode without provider credentials
- **THEN** the service returns a successful health response without provider calls

#### Scenario: Readiness reports missing configuration

- **WHEN** a caller requests `/ready` while required service configuration or local dependencies are unavailable
- **THEN** the service returns a stable non-success readiness response without provider calls

### Requirement: Graceful shutdown drains work

The system SHALL stop accepting new requests on shutdown, allow in-flight research handlers to settle, and document that abandoned work restarts from the beginning on the next process.

#### Scenario: In-flight request drains

- **WHEN** shutdown begins while a research request is running
- **THEN** new requests are refused or unavailable and the existing request is allowed to complete before server close

#### Scenario: Shutdown with no in-flight work completes

- **WHEN** shutdown begins with no active handlers
- **THEN** the server closes promptly without invoking any provider solely for shutdown
