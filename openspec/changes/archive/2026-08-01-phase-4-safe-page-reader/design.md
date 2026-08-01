## Context

The repository has validated page-reader input/output contracts and typed
`PAGE_RETRIEVAL_REJECTED` / `PAGE_RETRIEVAL_FAILURE` categories, but no runtime
reader. The reader will run server-side against attacker-controlled URLs and
content, so DNS resolution and redirect handling are security boundaries as
important as parsing.

## Goals / Non-Goals

**Goals:**

- Build a dependency-injected `read_page` tool with deterministic tests.
- Resolve every destination and reject loopback, private, link-local,
  multicast, reserved, IPv4-mapped, IPv6, and cloud-metadata addresses.
- Revalidate each redirect, enforce redirect/timeout/size/cancellation bounds,
  and avoid credential-bearing URLs.
- Parse supported text and HTML responses into bounded readable text with title
  and canonical URL metadata.
- Mark page text as untrusted evidence and emit safe hostname-only telemetry.

**Non-Goals:**

- Agent assembly, HTTP routes, authentication, persistence, or broad outbound
  allow-list deployment policy.
- Full browser rendering, JavaScript execution, PDF/OCR extraction, or a new
  third-party HTML parser dependency.

## Decisions

- **Inject DNS, fetch, clock, and timeout dependencies.** This keeps SSRF and
  redirect behavior testable without live network access. A custom transport
  abstraction is preferred over globally mocking `fetch`, while the standard
  `fetch` remains the default runtime transport.
- **Resolve and classify all addresses before each request.** URL string checks
  alone cannot detect a hostname resolving to an internal address. A URL is
  rejected if any resolved address is prohibited; redirects repeat the same
  process. IPv4-mapped IPv6 addresses are normalized before classification.
- **Handle redirects explicitly rather than relying on fetch redirect mode.**
  The transport uses `redirect: 'manual'`, validates the `Location` target, and
  stops after a small configured limit. This gives the policy a chance to run
  on every hop.
- **Read bounded bytes before parsing.** Content length is checked when present
  and the response body is consumed through a byte-limited reader with an
  abort signal. This prevents oversized content from reaching extraction or
  the model.
- **Use a conservative built-in HTML extractor.** Supported HTML is decoded,
  script/style/noscript/template blocks and tags are removed, entities are
  decoded, whitespace is normalized, and the document title plus canonical link
  are extracted. Plain text is normalized directly; binary and unsupported
  content types fail with a sanitized typed error.
- **Return untrusted evidence as a delimited observation.** The tool output
  includes a stable wrapper around extracted page text stating that it is
  untrusted and that embedded instructions must not be followed. This is a
  retrieval boundary, not an attempt to interpret page commands.

## Risks / Trade-offs

- [DNS rebinding between resolution and socket connection] → injected
  resolution and request metadata support deterministic checks; production
  deployment should add network egress policy as defense in depth.
- [HTML extraction is less complete than a browser/readability library] → keep
  extraction conservative and bounded; defer richer parsing until requirements
  justify a dependency.
- [Chunked responses may not expose a usable content length] → enforce the
  byte limit while consuming the body and abort on overflow.
- [Redirects can cross schemes or hosts] → validate the resolved absolute
  destination on every hop and reject unsupported schemes or prohibited hosts.

## Migration Plan

Add the tool and tests without changing existing callers. Later Phase 5 agent
assembly can inject this tool alongside `web_search`. Rollback is deleting the
new module and its registration once no consumer depends on it; no data
migration or deployment change is required.

## Open Questions

- The exact CG AgentFlow tool adapter will be selected in Phase 5; this phase
  exposes the repository's existing tool shape and keeps the transport
  independent of that adapter.
