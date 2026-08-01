## Context

Phase 1 provides a secret-safe environment loader only. Phase 3 and Phase 4
need stable, validated data at their seams, while later phases will add the HTTP
server, provider clients, and AgentFlow assembly. This phase must therefore
make boundaries executable without prematurely integrating external systems.

## Goals / Non-Goals

**Goals:**

- Parse all Phase 2 external inputs and outputs with Zod.
- Normalize only documented request and tool fields.
- Represent model-output failure and public errors as typed data.
- Keep tests deterministic and free of provider calls.

**Non-Goals:**

- Add HTTP routes, Tavily transport, page fetching, SSRF resolution, YAML
  assembly, AgentFlow tools, retries, or live-provider tests.
- Establish source-grounding membership; that requires the later run-level
  observed-URL tracker.

## Decisions

- Keep API, tool/provider, and model-output schemas in a contract module, with
  a separate error module. This is a small shared boundary, not a framework
  abstraction; later integrations can depend on contracts while errors remain
  free of provider-specific types. The alternative—schemas beside future
  transports/routes—would duplicate validation and delay the contract gate.
- Use `safeParse` wrappers returning discriminated results at untrusted model
  boundaries. This prevents a TypeScript assertion from admitting malformed
  structured output. Throwing parse APIs were rejected because an explicit
  `INVALID_AGENT_OUTPUT` outcome is simpler to map and test.
- Apply strict object schemas at the documented contract boundary and project
  parsed values into normalized public fields. Permissive passthrough schemas
  were rejected because they can admit accidental provider data and make the
  contract unstable.
- Generate a session ID through an injected callback when the optional input
  is absent. A global random generator was rejected so tests remain
  deterministic and the future HTTP layer can choose its request-ID mechanism.
- Map an explicit closed internal error-category union to static public code,
  status, and message. Raw `Error` text, provider payloads, and arbitrary
  metadata are deliberately excluded from serialization.

## Risks / Trade-offs

- [Strict upstream payload contracts may need extension when a provider is
  integrated] → Phase 3/4 will add only documented fields with a failing
  contract test.
- [URL safety is incomplete at schema level] → Phase 4 owns resolution,
  address classification, and redirect revalidation; this phase only limits
  input to one credential-free HTTP(S) URL.
- [Word counting can differ for unusual Unicode whitespace] → use trimmed
  whitespace-delimited words consistently and test the 500/501 boundary.
- [No source-membership validation yet] → expose structured sources now and
  add run-scoped grounding validation in Phase 5.

## Migration Plan

The modules are additive and have no deployed callers. Future routes and
transports will consume these parsers; rollback is removal of the unreferenced
additions before any integration is shipped.

## Open Questions

None for Phase 2. Provider-specific fields and public API serialization are
intentionally deferred to their roadmap phases.
