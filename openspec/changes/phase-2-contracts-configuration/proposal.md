## Why

The project foundation validates environment configuration, but the forthcoming
HTTP, tool, provider, and model boundaries do not yet have a common executable
contract. Defining these contracts now prevents unchecked external data and
unstable error responses from becoming embedded in later integrations.

## What Changes

- Add Zod-backed request and response contracts for the future `POST /research`
  API, including topic normalization, session generation, source evidence, and
  a 500-word brief limit.
- Add strict contracts for search, page-reader, Tavily-provider, and structured
  model-output data without making network calls or registering agent tools.
- Add a small typed internal-error vocabulary with deterministic HTTP mappings
  and sanitized public serialization.
- Add deterministic contract tests for valid, invalid, boundary, and redaction
  behavior.

## Capabilities

### New Capabilities

- `research-contracts`: Validated public API request/response and structured
  model-output boundaries for research runs.
- `research-tool-contracts`: Validated, bounded schemas for search, page-reader,
  and Tavily data passed between future integrations.
- `public-error-contracts`: Stable internal error categories, HTTP mapping, and
  sanitized public error responses.

### Modified Capabilities

- None.

## Impact

This adds TypeScript modules and deterministic Vitest suites under `src/` and
`test/`, plus Phase 2 OpenSpec artifacts. It does not add an HTTP server,
provider client, AgentFlow factory, YAML agent specification, or live external
calls.
