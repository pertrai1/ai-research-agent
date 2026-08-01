# AI Research Agent

Read-only autonomous web research agent. Phases 3 and 4 provide dependency-
injected, bounded `web_search` and `read_page` capabilities with validated
results, SSRF-resistant URL handling, timeout and retry controls, bounded text
extraction, untrusted-content delimiters, and privacy-safe telemetry. The
project does not yet expose research endpoints or agent assembly; those are
planned for later roadmap phases.

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

Both capabilities are currently library-level tools with injected transports.
They are not public HTTP endpoints and are not yet registered with a CG
AgentFlow agent.

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

Phases 1–4 are complete. Phase 5 will assemble the YAML-defined CG AgentFlow
ReAct agent and register only `web_search` and `read_page`; Phase 6 will add the
HTTP service and session memory. See [`ROADMAP.md`](./ROADMAP.md) for the
authoritative implementation sequence and exit criteria.
