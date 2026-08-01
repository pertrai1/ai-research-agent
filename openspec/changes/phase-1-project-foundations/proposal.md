## Why

The repository is a greenfield stub and cannot yet build, test, validate configuration, or run in CI. Phase 1 establishes a reproducible, secret-safe TypeScript foundation required by every later roadmap phase.

## What Changes

- Add a Node 24 TypeScript service baseline with build, test, lint, format, and start commands.
- Add token-free GitHub Packages scope configuration and documentation for local `read:packages` authentication.
- Protect credentials, environment files, generated output, dependencies, coverage, and test output with ignore rules.
- Add Zod-backed environment parsing with redacted validation errors and production-only secret requirements.
- Add deterministic environment-loader tests and GitHub Actions quality gates using lockfile installation and injected package credentials.
- Pin the CG AgentFlow package set and record any package/documentation discrepancy as an integration-test requirement.

## Capabilities

### New Capabilities

- `project-foundations`: Defines the reproducible Node/TypeScript toolchain, secret-safe configuration boundary, package-registry setup, and CI baseline required before application features.

### Modified Capabilities

None.

## Impact

- Adds project configuration, a minimal service entry point, environment loader, unit tests, CI workflow, lockfile, and setup documentation.
- Introduces build-time dependencies for TypeScript, Vitest, ESLint/Prettier, Zod, and the pinned CG AgentFlow package scope.
- Does not expose an HTTP API, invoke providers, register agent tools, or add credentials to source control.
