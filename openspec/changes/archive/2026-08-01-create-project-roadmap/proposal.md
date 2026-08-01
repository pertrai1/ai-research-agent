## Why

`REQUIREMENTS.md` defines the product, security, reliability, deployment, testing, and acceptance obligations for the AI research agent, but it does not turn them into an execution-ready plan. A phased roadmap with concrete tasks and requirement traceability is needed so implementation can proceed in dependency order without losing cross-cutting controls or acceptance criteria.

## What Changes

- Add a repository-level `ROADMAP.md` that decomposes the initial release into ordered delivery phases.
- Define concrete, verifiable tasks within each phase, including test-first work where required.
- Map every requirement family and acceptance criterion from `REQUIREMENTS.md` to at least one phase and task.
- Capture phase goals, dependencies, deliverables, and exit criteria so progress can be assessed consistently.
- Keep the roadmap aligned with the required CG AgentFlow/TypeScript architecture, security boundary, operational controls, and deployment target.

## Capabilities

### New Capabilities

- `requirements-driven-roadmap`: Defines how project requirements are translated into sequenced phases, actionable tasks, explicit dependencies, verification gates, and complete requirement traceability in `ROADMAP.md`.

### Modified Capabilities

None.

## Impact

- Adds `ROADMAP.md` at the repository root as the implementation-planning source of truth.
- Uses `REQUIREMENTS.md` as the authoritative input without changing its product requirements.
- Establishes the delivery sequence for future application code, tests, agent configuration, security controls, observability, containerization, and deployment work.
- Introduces no runtime, API, dependency, or production behavior changes by itself.
