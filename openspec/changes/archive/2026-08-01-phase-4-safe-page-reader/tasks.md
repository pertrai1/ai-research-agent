## 1. URL policy and transport boundaries

- [x] 1.1 Add failing URL-policy tests covering credentials, non-HTTP schemes, malformed hosts, loopback, private, link-local, multicast, reserved, IPv4-mapped IPv6, IPv6, and cloud metadata destinations.
- [x] 1.2 Define injected DNS resolution, fetch, timeout, clock, and cancellation seams plus typed page-reader result and telemetry types.
- [x] 1.3 Implement hostname resolution and address classification for IPv4/IPv6 prohibited ranges without string-only literal-IP checks.
- [x] 1.4 Add failing transport tests for redirect revalidation, redirect limits, timeout, response-size limits, and cancellation.
- [x] 1.5 Implement manual redirect handling and bounded injected page transport with per-hop destination validation and sanitized typed failures.

## 2. Text extraction and untrusted evidence

- [x] 2.1 Add failing parser tests for supported textual content types, rejected binary content, HTML title/canonical extraction, script/style removal, and character truncation.
- [x] 2.2 Implement bounded body decoding and conservative readable HTML/plain-text extraction before page content reaches the model.
- [x] 2.3 Add failing prompt-injection fixture tests for delimiters, ignored page commands, and absence of secret/tool disclosure.
- [x] 2.4 Implement explicit untrusted-content delimiters and safety instructions in page-reader output.

## 3. Tool integration and proof

- [x] 3.1 Expose the dependency-injected `read_page` tool using the existing page-reader contracts and typed error categories.
- [x] 3.2 Add sanitized page-read telemetry tests and implementation containing only duration, outcome, result size, and destination hostname.
- [x] 3.3 Refactor URL policy, transport, extraction, and tool boundaries while the complete Phase 4 suite remains green.
- [x] 3.4 Run formatting, lint, typecheck, deterministic tests, build, and strict OpenSpec validation; update Phase 4 roadmap status and record verification evidence.
