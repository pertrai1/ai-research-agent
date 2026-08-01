## Purpose

Define the bounded, read-only Tavily web-search capability and its reliability,
privacy, telemetry, and manual-connectivity evidence requirements.

## Requirements

### Requirement: Bounded read-only Tavily search

The system SHALL expose a dependency-injected `web_search` capability that accepts only the existing validated search-input contract, sends a read-only Tavily search request using an environment-supplied API key, and returns no more than five normalized results.

#### Scenario: A valid search returns normalized bounded results

- **WHEN** a caller supplies a valid query and Tavily returns documented result records
- **THEN** the capability returns at most five results containing title, URL, snippet, and an available relevance score

#### Scenario: Invalid input never reaches Tavily

- **WHEN** a caller supplies an empty, oversized, or malformed query input
- **THEN** the capability returns the typed invalid-request failure and makes no provider request

### Requirement: Bounded provider reliability controls

The system SHALL enforce an explicit timeout for every Tavily attempt and retry only transient timeout, connection, rate-limit, and server failures using bounded exponential backoff. Invalid requests, terminal client responses, and malformed provider payloads SHALL not be retried.

#### Scenario: A transient provider failure is retried

- **WHEN** an initial provider attempt fails with a retryable condition and a later attempt succeeds within the configured retry bound
- **THEN** the capability returns the normalized successful result after the bounded retry sequence

#### Scenario: A terminal provider failure is not retried

- **WHEN** Tavily returns a non-retryable client failure or malformed payload
- **THEN** the capability returns the typed search-provider failure without another attempt

### Requirement: Search credential and telemetry safety

The system SHALL keep Tavily API keys and authorization headers confined to the provider request. Tool observations, failures, serialized results, and search telemetry SHALL contain no API key, authorization header, raw provider error, query text, or response body. Search telemetry SHALL contain duration, outcome, and result count only.

#### Scenario: Provider failure is sanitised

- **WHEN** a provider failure includes sensitive request material or a raw error body
- **THEN** the returned failure and emitted telemetry omit that material

#### Scenario: A search outcome emits safe telemetry

- **WHEN** a search succeeds or fails
- **THEN** exactly one telemetry event records its duration, outcome, and result count without sensitive request material

### Requirement: Manual Tavily connectivity evidence

The system SHALL document a manually triggered Tavily connectivity check that requires credentials supplied at invocation time and is not included in the deterministic automated test suite.

#### Scenario: Default tests remain offline

- **WHEN** the repository's default test command is run without Tavily credentials
- **THEN** the command completes without attempting a live Tavily request
