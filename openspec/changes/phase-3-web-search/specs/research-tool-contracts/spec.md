## ADDED Requirements

### Requirement: Search runtime preserves validated contracts

The runtime web-search capability SHALL parse its caller input through `parseSearchInput` and parse every successful Tavily response through `parseTavilySearchResponse` before returning data to an agent or caller.

#### Scenario: Unsupported provider data cannot enter tool output

- **WHEN** Tavily returns fields or result values that do not satisfy the strict provider contract
- **THEN** the runtime returns a typed search-provider failure and no unvalidated result data
