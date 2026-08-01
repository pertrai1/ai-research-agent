## ADDED Requirements

### Requirement: Completed roadmap phase is explicit

`ROADMAP.md` SHALL identify Phase 1 as complete only when every Phase 1 task is
checked and the status line states the verified Node 24 clean-install, quality,
and secret-safety evidence. Later phases SHALL remain unchecked and retain their
declared dependencies.

#### Scenario: Maintainer reads the Phase 1 section

- **WHEN** a maintainer inspects Phase 1 in the roadmap
- **THEN** they can determine that its tasks and exit criteria are complete and
  that Phase 2 is the next incomplete phase

### Requirement: AGENTS guidance matches implemented foundations

`AGENTS.md` SHALL state the current project runtime, commands, source/test
layout, exact CG AgentFlow package pins, token-free GitHub Packages method, CI
secret name, current implementation boundary, and Phase 5 integration-test
follow-up. It SHALL NOT contain stale claims that the package manifest is a
stub or that Phase 1 commands are pending.

#### Scenario: Agent starts a follow-up task

- **WHEN** an agent reads `AGENTS.md` before working in the repository
- **THEN** it receives accurate commands and constraints without requiring prior
  conversation context or access to a credential value

### Requirement: Credential guidance remains secret-safe

The updated documentation SHALL identify only `NODE_AUTH_TOKEN` and
`GH_PACKAGES_TOKEN` variable names and SHALL NOT contain a literal GitHub,
provider, or package-registry credential.

#### Scenario: Documentation is inspected for secrets

- **WHEN** a maintainer reviews the roadmap and agent instructions
- **THEN** the files describe credential injection without exposing a token value
