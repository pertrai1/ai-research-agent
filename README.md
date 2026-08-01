# AI Research Agent

Read-only autonomous web research agent. Phase 3 adds a dependency-injected,
bounded Tavily `web_search` capability with validated results, timeout and
transient-only retry controls, and privacy-safe telemetry. The project does not
yet expose research endpoints, agent assembly, or page reading.

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
