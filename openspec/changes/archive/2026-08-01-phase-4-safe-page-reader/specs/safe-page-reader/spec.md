## ADDED Requirements

### Requirement: SSRF-safe page destination policy

The `read_page` capability SHALL accept exactly one credential-free `http` or
`https` URL and SHALL resolve and reject loopback, private, link-local,
multicast, reserved, IPv4-mapped, IPv6, and cloud-metadata destinations before
requesting them.

#### Scenario: Public URL is accepted

- **WHEN** a single public HTTP(S) URL resolves only to a public address
- **THEN** the reader permits the request to proceed

#### Scenario: Prohibited destination is rejected

- **WHEN** a URL contains credentials, uses another scheme, has a malformed
  host, or resolves to any prohibited IPv4/IPv6 destination
- **THEN** the reader returns `PAGE_RETRIEVAL_REJECTED` without fetching it

### Requirement: Bounded redirect and transport safety

The reader SHALL manually follow only a configured small number of redirects,
revalidate every redirect destination with the same SSRF policy, enforce a
timeout and response-size limit, and propagate cancellation.

#### Scenario: Redirect target is revalidated

- **WHEN** a public page redirects to a prohibited, credential-bearing, or
  unsupported destination
- **THEN** the reader rejects the redirect and does not request that target

#### Scenario: Bounds stop retrieval

- **WHEN** a response exceeds the byte limit, exceeds the redirect limit, times
  out, or is cancelled
- **THEN** the reader returns a typed sanitized retrieval failure and bounded
  telemetry without page content

### Requirement: Bounded textual page extraction

The reader SHALL accept supported textual content types, remove HTML scripts,
styles, and markup, extract title and canonical URL metadata when available,
normalize readable text, and truncate it to the configured character limit
before returning it.

#### Scenario: HTML becomes readable bounded text

- **WHEN** a supported HTML response contains title, canonical link, scripts,
  styles, markup, and ordinary text
- **THEN** the output contains bounded normalized text and metadata but not the
  script/style contents or raw tags

#### Scenario: Unsupported content is rejected

- **WHEN** a response has a binary or unsupported content type, an empty body,
  or malformed page metadata
- **THEN** the reader returns `PAGE_RETRIEVAL_FAILURE` without returning content

### Requirement: Untrusted content and telemetry safety

Retrieved text SHALL be clearly delimited as untrusted evidence with
instructions that embedded page commands must not be followed or used to
disclose secrets or invoke unrelated capabilities. Telemetry SHALL contain
duration, outcome, result size, and destination hostname only.

#### Scenario: Prompt-injection text remains delimited

- **WHEN** a page says to override trusted instructions, reveal secrets, or
  invoke another tool
- **THEN** the returned observation preserves it only inside the untrusted
  content delimiter and does not execute or disclose anything

#### Scenario: Telemetry is sanitized

- **WHEN** a page read succeeds or fails for a URL containing sensitive path or
  query material
- **THEN** exactly one telemetry event omits the full URL, headers, secrets,
  errors, and page text
