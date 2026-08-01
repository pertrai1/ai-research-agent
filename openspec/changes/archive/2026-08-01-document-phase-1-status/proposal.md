## Why

Phase 1 is implemented and verified, but the roadmap lacks an explicit phase-complete status and `AGENTS.md` still describes the repository as a pre-foundation stub. Updating both prevents future agents from using obsolete commands, dependencies, and setup assumptions.

## What Changes

- Mark Phase 1 complete in `ROADMAP.md` with its verified completion evidence.
- Replace Phase 1-pending statements in `AGENTS.md` with the established commands, repository layout, exact AgentFlow pins, package-authentication method, CI secret name, and current implementation boundaries.
- Preserve `REQUIREMENTS.md` as the authoritative product contract and leave later phases unchanged.

## Capabilities

### New Capabilities

- `project-status-documentation`: Defines accurate status and operational guidance for completed project foundation work.

### Modified Capabilities

None.

## Impact

- Updates `ROADMAP.md` and `AGENTS.md` only, plus the OpenSpec documentation for this change.
- Changes no runtime behavior, dependencies, CI behavior, external credentials, or product requirements.
