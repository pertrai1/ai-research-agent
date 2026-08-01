## ADDED Requirements

### Requirement: Authenticated public research API

The service SHALL require a configured API key for `POST /research` and
`GET /ready`, SHALL derive the client identity only after successful key
validation, and SHALL return a stable authentication error without invoking the
executor for missing, malformed, or invalid credentials.

#### Scenario: Valid key authenticates a request

- **WHEN** a caller sends the configured API key in the supported header
- **THEN** the request proceeds with a privacy-safe derived client identity

#### Scenario: Missing or invalid key is rejected

- **WHEN** a caller omits or sends an invalid API key
- **THEN** the service returns the stable authentication failure and does not
  invoke research execution

### Requirement: Admission and request-size controls

The service SHALL enforce a per-client bounded rate limit, a maximum request
body size, and a maximum number of active research executions, returning stable
rate-limit or service-busy errors before invoking the executor when a bound is
exceeded.

#### Scenario: Excessive rate is rejected

- **WHEN** one authenticated client exceeds its configured request rate
- **THEN** the service returns a rate-limit failure and does not start research

#### Scenario: Oversized request is rejected

- **WHEN** a request body exceeds the configured byte limit
- **THEN** the service returns an invalid-request failure without parsing or
  executing the request

#### Scenario: Concurrency backpressure is applied

- **WHEN** the active research limit is full
- **THEN** a newly authenticated research request returns a service-busy
  failure without invoking the executor

### Requirement: Explicit browser and response security policy

The service SHALL emit standard security headers on every response, SHALL
disable CORS unless an explicit allow-list is configured, and SHALL never use a
wildcard CORS origin together with credentials.

#### Scenario: Default response is non-browser-public

- **WHEN** a caller requests any service route without CORS configuration
- **THEN** the response contains security headers and no permissive CORS header

#### Scenario: Configured origin is allowed

- **WHEN** a request Origin matches the explicit configured allow-list
- **THEN** the service emits the matching CORS origin and credentials policy

### Requirement: Authenticated readiness and cheap liveness

The service SHALL keep `/health` provider-free and unauthenticated for platform
liveness, while `/ready` SHALL use the authentication and control policy and
remain provider-free.

#### Scenario: Health remains cheap

- **WHEN** an unauthenticated caller requests `/health`
- **THEN** the service returns liveness without invoking a provider or executor

#### Scenario: Readiness is protected

- **WHEN** an unauthenticated caller requests `/ready`
- **THEN** the service returns the stable authentication failure without a
  provider call
