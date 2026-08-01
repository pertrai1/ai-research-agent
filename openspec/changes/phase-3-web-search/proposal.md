## Why

The agent has validated search contracts but cannot yet retrieve public-web evidence. Phase 3 adds the bounded, read-only Tavily capability required before the research agent can make grounded search decisions.

## What Changes

- Add an injected Tavily HTTP transport with a bounded request timeout and retry policy limited to transient failures.
- Add a `web_search` tool that validates input and provider output, limits results to five, and returns normalized search results.
- Add privacy-safe search telemetry and tests that prove credentials never reach observations, errors, telemetry, or serialized results.
- Add a documented, manually triggered live Tavily connectivity check that is excluded from the deterministic test suite.

## Capabilities

### New Capabilities

- `bounded-web-search`: Read-only, validated Tavily search with explicit limits, retry/timeout controls, sanitization, and telemetry.

### Modified Capabilities

- `research-tool-contracts`: Connect the existing search contract to the new runtime search capability without changing its validation requirements.

## Impact

Adds a search transport and tool under `src/`, focused fake-transport tests under `test/`, Phase 3 OpenSpec artifacts, and manual-check documentation. It does not assemble the agent, register tools with CG AgentFlow, add page reading, or make live-provider calls in the default suite.
