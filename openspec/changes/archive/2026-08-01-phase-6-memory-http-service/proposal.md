## Why

Phase 5 provides a source-grounded research agent, but callers cannot yet invoke it through a service boundary or continue a conversation safely. Phase 6 completes the initial local service contract with bounded in-memory memory, isolated sessions, health/readiness checks, stable errors, and graceful shutdown.

## What Changes

- Add a YAML-declared sliding-window memory policy with a configurable 50-message default.
- Add an in-memory `MemoryStore` and lifecycle integration so follow-up requests reuse only their own session context.
- Expose `POST /research` with validated requests and structured research responses.
- Expose provider-free `GET /health` and configuration/local-dependency `GET /ready` endpoints.
- Map all service failures through the existing sanitized public error contract.
- Add graceful shutdown that stops accepting new work and drains in-flight requests.
- Document restart-from-beginning semantics; exact mid-run checkpoint recovery remains out of scope.

## Capabilities

### New Capabilities

- `conversation-memory`: Bounded, session-scoped memory lifecycle and restart semantics.
- `research-http-service`: HTTP research, health, readiness, error, and graceful-shutdown behavior.

### Modified Capabilities

- None.

## Impact

- Affected source includes agent configuration/assembly, new memory and HTTP service modules, and the compiled startup entry point.
- New deterministic memory, API, health/readiness, and shutdown tests will use injected fake agents/transports and make no live provider calls.
- The service adds Node HTTP runtime behavior while preserving the existing validated contracts, read-only tool allow-list, and sanitized error vocabulary.
