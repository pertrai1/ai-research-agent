# Privacy-Safe Observability

## Purpose

Define correlated diagnostics and metrics that preserve operational value
without retaining sensitive research content or credentials.

## Requirements

### Requirement: Correlated lifecycle observability

The service SHALL emit privacy-safe structured events for overall request,
agent, tool, provider, guardrail, budget, timeout, validation, and iteration
exhaustion outcomes, each correlated to a run ID and a privacy-safe client and
session identifier where available.

#### Scenario: Successful run is diagnosable

- **WHEN** an authenticated research request completes successfully
- **THEN** request, agent, tool/provider, and completion events share its
  correlation ID and include duration/outcome metrics without prompt or page
  text

#### Scenario: Failure is diagnosable

- **WHEN** validation, provider, budget, timeout, or iteration exhaustion
  occurs
- **THEN** an event identifies the sanitized category and correlation ID without
  raw dependency errors

### Requirement: Operational metrics

The service SHALL expose or collect metrics for request rate, success rate,
latency, tool and provider failures, iteration exhaustion, token usage, and
estimated cost using bounded numeric and label values.

#### Scenario: Metrics record bounded aggregates

- **WHEN** requests and agent runs complete or fail
- **THEN** the metrics sink updates the required aggregate counters/histograms
  without storing complete prompts, pages, headers, or secrets

### Requirement: Centralized sensitive-data redaction

The system MUST pass all logs, traces, metrics labels, public errors, tool
observations, and provider diagnostics through centralized sanitization. The
sanitization MUST remove API keys, authorization headers, prompts, retrieved
page content, raw provider payloads, and filesystem paths.

#### Scenario: Sensitive event fields are removed

- **WHEN** an event or error contains a key, header, prompt, page, provider
  body, or path
- **THEN** the emitted representation contains neither the sensitive value nor
  an equivalent raw payload

#### Scenario: Safe operational fields survive

- **WHEN** an event includes duration, outcome, bounded counts, and correlation
  identifiers
- **THEN** those safe fields remain available for diagnosis
