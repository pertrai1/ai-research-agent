## Why

Phase 4 needs a usable `read_page` capability before the research agent can
select and verify sources. Direct URL fetching is unsafe for a server-side
agent unless hostname resolution, redirects, response bounds, and retrieved
content are treated as untrusted inputs.

## What Changes

- Add an injected, read-only `read_page` capability for bounded HTTP(S) text retrieval.
- Enforce credential-free URLs, DNS-based SSRF destination policy, redirect revalidation, timeouts, cancellation, and response-size limits.
- Accept supported textual content types, extract bounded readable HTML text, and remove scripts/styles/raw markup.
- Delimit retrieved page text as untrusted evidence with explicit prompt-injection-resistant instructions.
- Emit privacy-safe page-read telemetry and typed sanitized retrieval failures.
- Complete the Phase 4 roadmap checkboxes and add deterministic security/content fixtures.

## Capabilities

### New Capabilities

- `safe-page-reader`: SSRF-resistant page retrieval, bounded textual extraction, untrusted-content handling, and safe telemetry.

### Modified Capabilities

- None.

## Impact

- Adds `src/page-reader.ts` and focused tests, with a small contract extension only if the existing page-reader schemas need runtime-facing types.
- Uses Node.js injected fetch and DNS resolution facilities without adding dependencies.
- Preserves the existing typed error vocabulary and read-only tool boundary; agent assembly and HTTP service remain out of scope until later roadmap phases.
