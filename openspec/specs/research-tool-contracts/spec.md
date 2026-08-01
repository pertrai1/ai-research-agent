## Purpose

Define validated and bounded search, provider, and page-reader data contracts
before external retrieval integrations are introduced.

## Requirements

### Requirement: Search and provider contracts

The system SHALL parse a strict, non-empty, length-bounded search query and a
strict Tavily result payload. It SHALL normalize results to title, URL, snippet,
and optional relevance score, and SHALL reject unsupported or malformed
provider payload data.

#### Scenario: Bounded search data is accepted

- **WHEN** a search query and Tavily results use documented fields within their limits
- **THEN** the parsed contract contains no more than five normalized results

#### Scenario: Invalid provider data is rejected

- **WHEN** a search query is empty or oversized, a result is malformed, or the provider payload has unsupported fields
- **THEN** the contract parser rejects the data before it reaches an agent

### Requirement: Search runtime preserves validated contracts

The runtime web-search capability SHALL parse its caller input through `parseSearchInput` and parse every successful Tavily response through `parseTavilySearchResponse` before returning data to an agent or caller.

#### Scenario: Unsupported provider data cannot enter tool output

- **WHEN** Tavily returns fields or result values that do not satisfy the strict provider contract
- **THEN** the runtime returns a typed search-provider failure and no unvalidated result data

### Requirement: Page-reader contracts

The system SHALL parse exactly one credential-free HTTP(S) URL as page-reader
input and SHALL parse a strict page result with requested URL, final canonical
URL, optional title, and bounded extracted text.

#### Scenario: Valid page contract is accepted

- **WHEN** one public HTTP(S) URL and a documented textual page result are supplied
- **THEN** the parser returns the normalized page-reader contract

#### Scenario: Invalid page contract is rejected

- **WHEN** the input contains multiple fields, URL credentials, an unsupported scheme, or malformed output
- **THEN** the parser rejects the data before page retrieval behavior runs
