## 1. Test-first search boundary

- [x] 1.1 Add focused fake-transport tests for validated input, normalized five-result output, timeout, transient retries, terminal failures, malformed payloads, telemetry, and credential redaction.
- [x] 1.2 Confirm the focused suite fails because the Phase 3 runtime search capability does not yet exist.

## 2. Bounded Tavily implementation

- [x] 2.1 Implement the injected Tavily REST transport with explicit per-attempt timeout, bounded transient-only exponential retry, and sanitized typed failures.
- [x] 2.2 Implement the dependency-injected read-only `web_search` tool that uses existing input/provider contracts and emits safe telemetry.
- [x] 2.3 Refactor only as necessary while the focused fake-provider suite remains green.

## 3. Evidence and release readiness

- [x] 3.1 Document the opt-in manual Tavily connectivity check and confirm default tests remain offline.
- [x] 3.2 Run strict OpenSpec validation, formatting, type checking, linting, deterministic tests, and production build; record verification evidence.
