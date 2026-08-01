# AI Research Agent

Read-only autonomous web research agent. Phases 3 and 4 provide dependency-
injected, bounded `web_search` and `read_page` capabilities with validated
results, SSRF-resistant URL handling, timeout and retry controls, bounded text
extraction, untrusted-content delimiters, and privacy-safe telemetry. Phase 5
assembles those capabilities into a YAML-defined CG AgentFlow ReAct agent with
source grounding; Phase 6 adds a session-scoped in-memory window and HTTP service.

## Implemented capabilities

`web_search` sends bounded Tavily searches using the runtime API key, returns at
most five normalized results, retries only transient failures, and never places
credentials in tool output or telemetry.

`read_page` accepts one credential-free public HTTP(S) URL. It resolves and
classifies destinations, rejects private and reserved IPv4/IPv6 networks and
cloud metadata addresses, revalidates every redirect, and enforces redirect,
timeout, cancellation, and response-size limits. Supported HTML and text
responses are reduced to bounded readable text; scripts, styles, and raw markup
are removed. Retrieved text is explicitly marked as untrusted evidence, so
page instructions are not treated as agent instructions.

Both capabilities are library-level tools with injected transports and are
registered by the research-agent assembly. `POST /research` returns the
validated structured brief; `GET /health` is a provider-free liveness check and
`GET /ready` checks local/configuration readiness.

Conversation memory is process-local and bounded to the most recent 50
messages per session by the YAML-declared sliding window. A process restart
clears this store: an interrupted run starts again from the beginning, and
exact mid-run checkpoint recovery is not provided in the initial service.

## Research agent

The agent specification is [`config/agents/research-agent.yaml`](./config/agents/research-agent.yaml).
It declares a ReAct agent using Anthropic, temperature `0.2`, a 1,500-token
output limit, at most 15 iterations, bounded observations, and exactly
`web_search` plus `read_page`. Runtime code supplies the injected tool
implementations and calls CG AgentFlow's `createAgentFromFile` factory.

Each run records URLs returned by successful tool calls. A final source is
accepted only when its URL appears in that run's observed-URL ledger. Invalid
structured output receives one repair attempt before returning the typed
`INVALID_AGENT_OUTPUT` failure. Retrieved page text remains explicitly
untrusted evidence and is never treated as instructions.

The default test suite uses deterministic transports and AgentFlow lifecycle
hooks; it makes no Anthropic or Tavily calls. The installed CG AgentFlow
version does not expose provider injection on `createAgentFromFile`, so the
limitation and test workaround are recorded in
[`docs/agent-flow-findings.md`](./docs/agent-flow-findings.md).

## Requirements

- Node.js 24.x
- npm 9 or later
- For CG AgentFlow packages: a GitHub token with `read:packages`, supplied only
  through `NODE_AUTH_TOKEN`

## Setup and commands

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm start
```

The repository's `.npmrc` maps `@cadmusgroup-llc` to GitHub Packages and reads
its token only from `NODE_AUTH_TOKEN`. Do not add credentials to `.npmrc`,
`.env`, source code, logs, or commits. Use environment or secret-store
configuration instead.

For local provider checks, copy `.env.example` to `.env` and fill in your own
`TAVILY_API_KEY`. The current Phase 3 manual check loads that ignored file only
for the command; the deterministic test suite never loads it or makes a live
provider request.

For GitHub Actions, configure `GH_PACKAGES_TOKEN` as a repository secret holding
a package-read credential. The CI workflow maps it to `NODE_AUTH_TOKEN` only for
the `npm ci` step.

`ANTHROPIC_API_KEY` and `TAVILY_API_KEY` are optional for this local foundation
command. They are required when `NODE_ENV=production`; validation errors name
invalid fields without returning supplied values.

## Manual Tavily check

The deterministic test suite never makes a live provider call. For the
credential-supplied, opt-in connectivity check and evidence rules, see
[`docs/tavily-manual-check.md`](./docs/tavily-manual-check.md).

## CG AgentFlow integration note

The required package names are `@cadmusgroup-llc/cg-agent-flow-core`, `-llm`,
`-tools`, `-agents`, `-guardrails`, `-memory`, `-observability`, and
`-evaluation`; all are pinned to `0.17.1`, as retrieved from the authorized
GitHub Packages registry on 2026-08-01. Context7 does not provide documentation
for this private package family. Before Phase 5, add an integration test that
covers the installed `createAgentFromFile` factory API and resolves any
documentation/package discrepancy. Do not replace these packages with
similarly named public packages.

## Delivery status

Phases 1–5 are complete. Phase 5 was verified with 34 deterministic tests,
strict OpenSpec validation, formatting, linting, type checking, and a
production build. Phase 6 adds the HTTP service and session memory. See
[`ROADMAP.md`](./ROADMAP.md) for the authoritative implementation sequence and
exit criteria.
