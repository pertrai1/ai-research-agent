## Context

Phase 1 is complete on the active feature branch: the repository has Node 24
tooling, exact dependency pins, a token-free registry configuration, a Zod
environment boundary, CI, documentation, and green quality gates. The roadmap
marks individual tasks complete but does not explicitly mark the phase outcome.
`AGENTS.md` still says the project is greenfield and lists Phase 1 commands as
pending, which conflicts with the repository's current manifest and CI.

## Goals / Non-Goals

**Goals:**

- Make Phase 1 completion visible without changing the ordering or scope of
  later roadmap phases.
- Give future agents the exact, current commands, source/test layout, package
  versions, authentication flow, CI secret name, and Phase 5 integration-test
  follow-up needed to work safely.

**Non-Goals:**

- Modify runtime code, tests, dependencies, CI behavior, or requirements.
- Archive the completed Phase 1 OpenSpec change.
- Claim that later roadmap phases have started or that AgentFlow factory behavior
  has been integration-tested.

## Decisions

### 1. Add an explicit Phase 1 completion status line

The roadmap will add a status line under Phase 1 that names the commit and
verified gates. This preserves the existing checkbox/exit-criteria convention
without changing the roadmap's requirements authority.

### 2. Make AGENTS.md operationally precise

The updated project context will replace stale greenfield/pending-command text
with facts visible in `package.json`, `.npmrc`, CI, README, and the Phase 1
OpenSpec artifacts. It will state that package credentials come only through
`NODE_AUTH_TOKEN` and CI through `GH_PACKAGES_TOKEN`, never as literals.

### 3. Preserve explicit boundaries and unfinished work

The update will retain the read-only tool restriction, Zod boundary rule,
production-only provider-secret requirement, and the Phase 5 factory integration
test follow-up. This avoids treating dependency installation as proof of agent
runtime behavior.

## Risks / Trade-offs

- **[Risk] Documentation drifts from implementation.** → Base every statement on
  the committed Phase 1 files and gates, and avoid speculative future details.
- **[Risk] A status label obscures exit criteria.** → State the evidence alongside
  the completion line and leave all exit criteria intact.
- **[Risk] Credential instructions are copied unsafely.** → Document variable and
  secret names only; never include a token value or token-generation output.

## Migration Plan

1. Update the two documents and this OpenSpec change.
2. Validate the OpenSpec change, formatting, and documentation diff.
3. Commit the documentation-only change on the existing feature branch.

## Open Questions

None.
