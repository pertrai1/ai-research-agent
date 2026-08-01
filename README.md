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

Production requests use `RESEARCH_API_KEY` with `Authorization: Bearer ...`.
Research calls are rate- and concurrency-limited, body-bounded, deadline-
cancelled, and emit privacy-safe correlated telemetry; `/health` remains
unauthenticated for liveness and `/ready` is authenticated.

The agent also enforces the YAML-declared per-run CostGuard budget and emits
bounded request, agent, provider, and tool metrics without retaining prompts,
retrieved pages, credentials, headers, or raw provider errors. CORS is disabled
unless an explicit origin allow-list is configured.

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
hooks; it makes no Anthropic or Tavily calls. HTTP service tests use in-process
request/response doubles, so the default suite also requires no socket access.
The installed CG AgentFlow version does not expose provider injection on
`createAgentFromFile`, so the
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

The application reads configuration from the process environment. It does not
automatically load `.env`, so load the ignored local file into your shell before
starting the service:

```sh
cp .env.example .env
# Edit .env and replace both placeholder values with your own keys.
set -a
. ./.env
set +a
```

Never commit `.env` or replace the placeholders in `.env.example` with real
credentials.

## Testing the agent

Use the following checks to confirm both the code and the running agent behave
as expected.

### 1. Run the offline test suite

This is the first check and requires no provider credentials or network access:

```sh
npm test
```

All tests should pass. The suite covers request/response validation, search and
page-reading boundaries, source grounding, session-memory isolation, HTTP
errors, health/readiness, authentication, rate/concurrency controls, deadlines,
CostGuard, telemetry redaction, and graceful shutdown. It does not call
Anthropic or Tavily.

### 2. Start the service with provider credentials

You need both an Anthropic key and a Tavily key for a real research request.
After loading `.env` as shown above, start the service:

```sh
npm run build
NODE_ENV=production PORT=3000 npm start
```

Keep that terminal running. In a second terminal, check liveness and readiness:

```sh
curl http://localhost:3000/health
curl -H "Authorization: Bearer $RESEARCH_API_KEY" http://localhost:3000/ready
```

Expected responses are:

```json
{"status":"ok"}
{"status":"ready"}
```

### 3. Submit a research request

```sh
curl -sS -X POST http://localhost:3000/research \
  -H "Authorization: Bearer $RESEARCH_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"topic":"How do current battery technologies compare?"}'
```

A successful response contains:

- a normalized `topic`;
- a generated `sessionId`;
- a `runId` for this research run;
- a concise `brief`;
- `sources` containing observed HTTP URLs; and
- an `uncertainty` value, either text or `null`.

The request should cause the agent to search the web and read relevant pages.
The returned sources should support the brief; fabricated URLs should not be
accepted.

### 4. Verify follow-up memory

Copy the `sessionId` from the first response and use it in a follow-up:

```sh
curl -sS -X POST http://localhost:3000/research \
  -H "Authorization: Bearer $RESEARCH_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"topic":"What evidence in the previous answer is most uncertain?","sessionId":"PASTE_SESSION_ID_HERE"}'
```

The response should preserve the supplied `sessionId`. A follow-up using a
different session ID should not receive the first session’s conversation
context.

### 5. Check a validation failure

```sh
curl -i -sS -X POST http://localhost:3000/research \
  -H "Authorization: Bearer $RESEARCH_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"topic":"   "}'
```

The service should return HTTP `400` with this sanitized shape:

```json
{ "error": { "code": "INVALID_REQUEST", "message": "The request is invalid." } }
```

Press `Ctrl-C` in the server terminal when finished. The service should stop
accepting new requests and allow an in-flight request to finish.

If you do not have provider credentials, start with `NODE_ENV=development` to
exercise `/health` and `/ready`; a real `/research` request cannot complete
without Anthropic and Tavily access.

For GitHub Actions, configure `GH_PACKAGES_TOKEN` as a repository secret holding
a package-read credential. The CI workflow maps it to `NODE_AUTH_TOKEN` only for
the `npm ci` step.

`ANTHROPIC_API_KEY` and `TAVILY_API_KEY` are optional for this local foundation
command. `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, and `RESEARCH_API_KEY` are
required when `NODE_ENV=production`; validation errors name invalid fields
without returning supplied values.

## Manual Tavily check

The deterministic test suite never makes a live provider call. For the
credential-supplied, opt-in connectivity check and evidence rules, see
[`docs/tavily-manual-check.md`](./docs/tavily-manual-check.md).

## CG AgentFlow integration note

The required package names are `@cadmusgroup-llc/cg-agent-flow-core`, `-llm`,
`-tools`, `-agents`, `-guardrails`, `-memory`, `-observability`, and
`-evaluation`; all are pinned to `0.17.1`, as retrieved from the authorized
GitHub Packages registry on 2026-08-01. Context7 does not provide documentation
for this private package family. The installed `createAgentFromFile` factory
API is covered by the Phase 5 deterministic integration tests. Do not replace these packages with
similarly named public packages.

## Delivery status

Phases 1–7 are complete. Phase 7 was verified with 56 deterministic tests,
strict OpenSpec validation, formatting, linting, type checking, and a
production build. Phase 8 is the next implementation phase and covers
container deployment, evaluation, and release evidence. See
[`ROADMAP.md`](./ROADMAP.md) for the authoritative implementation sequence and
exit criteria.
