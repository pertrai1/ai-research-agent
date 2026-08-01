## Context

Phase 2 defines strict search input and Tavily-result contracts but has no runtime retrieval. Phase 3 needs an external HTTP boundary, tool-facing behavior, and operational metadata while preserving SEC-1 and SEC-4. The repository intentionally has no Tavily SDK dependency, so the integration must use injected platform primitives and fake transports.

Scope budget: I expect to touch a new search transport/tool module, focused search tests, Phase 3 OpenSpec artifacts, and manual-check documentation; I will not change agent assembly, HTTP routes, page reading, package dependencies, or existing Phase 2 contract semantics unless evidence shows they are required.

## Goals / Non-Goals

**Goals:**

- Make a single bounded Tavily search available through an injected `web_search` tool surface.
- Validate tool input and provider payloads with the existing Zod-backed contracts.
- Enforce five-result limits, per-attempt timeout, bounded exponential retry for transient failures only, and sanitized outcomes.
- Emit only duration, outcome, and result-count telemetry for search activity.

**Non-Goals:**

- Registering tools with an agent, adding a page reader, exposing an HTTP endpoint, or retrying an entire agent run.
- Logging or returning provider credentials, authorization headers, raw response bodies, or raw provider errors.
- Running a real Tavily request from the deterministic suite.

## Decisions

### Use an injected Fetch-compatible transport and a small `web_search` factory

The transport receives `fetch`, a clock, and a sleeper as dependencies, while the tool receives a transport and telemetry sink. This makes timeout, retry, malformed-payload, and redaction behavior deterministic with fakes. A direct global `fetch` implementation would be smaller but cannot prove retry timing or outbound request sanitization without fragile global mocks. Adding Tavily's SDK would add a dependency and hide the exact failure boundary unnecessarily.

### Use Tavily's REST `POST /search` endpoint with bearer authentication

The transport sends only the validated query and a result limit of five, with `Authorization: Bearer <environment-only key>` and JSON content type. This follows Tavily's current documented REST endpoint and keeps auth at the provider boundary. Passing the key through the tool result would violate SEC-4.

### Retry only recognized transient failures

Timeouts, connection failures, HTTP 408, HTTP 429, and 5xx responses are retryable. Other 4xx responses and schema failures are terminal. The retry count and exponential delay are finite and injected. Retrying all failures would mask bad requests and malformed provider behavior; no retry would make temporary provider outages needlessly terminal.

### Return stable sanitized failure categories

The tool maps invalid caller input to `INVALID_REQUEST`; any provider, timeout, transport, or payload failure becomes `SEARCH_PROVIDER_FAILURE`. The public runtime values never retain request headers, API keys, or raw error payloads. This fits Phase 2's stable error vocabulary.

### Telemetry is opt-in and receives only safe metadata

The tool emits `{ durationMs, outcome, resultCount }` after success or failure. It intentionally excludes query, URL, headers, provider body, and exception data. A generic logger would be more reusable but creates an unnecessarily broad privacy surface for this phase.

## Risks / Trade-offs

- [Tavily API compatibility changes] → Keep REST request/response parsing behind the transport, enforce a documented manual connectivity check, and record confirmed framework package issues separately if encountered.
- [A fake transport differs from Node fetch] → Use a Fetch-compatible signature and test the constructed request plus abort behavior directly.
- [Retry delays slow tests] → Inject the sleeper; production uses a real bounded delay while tests use a resolved fake.
- [Credential exposure through thrown errors] → Convert all transport failures to typed, sanitised results before they leave the module and test known secret/header strings explicitly.

## Migration Plan

1. Land the isolated tool and fake-provider suite with no runtime wiring, so no existing caller changes.
2. Operators provide `TAVILY_API_KEY` only through the existing environment loader when invoking the manual check.
3. Later Phase 5 registers this existing tool as one of the two approved agent tools; rollback is removal of that registration, not a change to the transport contract.

## Open Questions

- None blocking. The exact manual-check invocation will be documented after the tool's public factory is implemented.
