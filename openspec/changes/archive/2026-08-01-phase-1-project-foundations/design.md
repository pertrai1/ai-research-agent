## Context

The repository currently contains only product requirements, roadmap artifacts, and a stub CommonJS `package.json`. All later phases require a predictable Node 24 TypeScript toolchain, validated startup configuration, safe package-registry access, and CI evidence. Provider secrets and GitHub Packages credentials must never enter the repository, logs, or built artifacts.

## Goals / Non-Goals

**Goals:**

- Make the minimal service entry point type-check, test, lint, format, build, and start through documented npm scripts.
- Define a Zod-validated environment boundary that redacts all supplied values in validation errors and requires provider secrets only in production.
- Configure package registry and CI so credentials are injected at install time rather than stored in tracked files.
- Pin the required CG AgentFlow package set and preserve an explicit integration-test follow-up where published artifacts do not match available documentation.

**Non-Goals:**

- Implement HTTP routes, agent construction, Anthropic/Tavily calls, or any agent tools.
- Verify a live private-package installation without a supplied `read:packages` credential.
- Introduce container images, deployment configuration, runtime telemetry, or a secret manager.

## Decisions

### 1. Use native Node tooling with TypeScript, Vitest, ESLint, and Prettier

The project will use ESM TypeScript compiled to `dist/`, Vitest for deterministic unit tests, ESLint plus `eslint-plugin-llm-core` for linting, and Prettier for formatting. `start` executes the built entry point; `dev` is intentionally deferred because the roadmap only requires a reproducible minimal start command.

This is preferred over a framework-specific starter because it keeps the first phase small and avoids choosing the Phase 6 HTTP framework early. A no-build TypeScript runtime was rejected because production startup must exercise the compiled artifact.

### 2. Keep environment parsing in one pure module

`loadEnvironment(input)` will accept an injected record, parse it with Zod, and return either local defaults or production-required credentials. Error text will report field names and generic validation reasons only, never input values. The process entry point is the sole caller that reads `process.env`.

This is preferred over scattered direct environment reads because it creates one testable and auditable boundary. Requiring all secrets locally was rejected because it blocks the minimal service and deterministic tests; accepting missing production secrets was rejected by SEC-4.

### 3. Use a token-free tracked npm configuration

The tracked `.npmrc` will map `@cadmusgroup-llc` to GitHub Packages without credentials. Local credentials use the user-level npm configuration or an ignored project-local configuration populated from an environment variable; setup documentation will explain the required `read:packages` scope without printing a token.

This is preferred over committing a placeholder token because a placeholder is easy to replace unsafely and can be accidentally logged. Public-registry-only installation is rejected because the required framework packages are scoped to GitHub Packages.

### 4. Pin all Phase 1 dependencies and use lockfile-only CI installs

`package.json` will use exact versions for direct dependencies and the committed lockfile will define transitive resolution. CI will use Node 24 and `npm ci`, supply package credentials only via an Actions secret, then run type-check, lint, test, and build.

This is preferred over version ranges and `npm install` in CI because it makes failures reproducible. CI that skips private package installation is rejected because it would not prove the production dependency graph.

### 5. Record the CG AgentFlow documentation gap as executable follow-up

Context7 does not expose documentation for the required `@cadmusgroup-llc` package family. The Phase 1 documentation records the exact names mandated by `REQUIREMENTS.md`, pins all seven packages to the authorized-registry version `0.17.1`, and requires a Phase 5 integration test to validate the installed factory API. This keeps unavailable documentation from becoming an invented API contract.

## Risks / Trade-offs

- **[Risk] Private package credentials are unavailable locally.** → Keep credentials external, complete all non-private deterministic work, and fail installation transparently rather than substituting a public package.
- **[Risk] Node 24 or an exact tool version is not installed in a contributor environment.** → Declare engine expectations and rely on CI's pinned Node major version as the canonical proof.
- **[Risk] Validation errors expose secrets.** → Tests pass representative secret strings and assert that none appear in returned error text.
- **[Risk] A later HTTP framework forces script changes.** → Keep the entry point minimal and defer framework choice until Phase 6.

## Migration Plan

1. Add the configuration, source, test, CI, documentation, and ignore artifacts.
2. Install exact dependencies and generate the lockfile using credential injection where required.
3. Run the documented quality gates on Node 24.
4. Roll back by reverting the single Phase 1 change; no data migration or external state exists.

## Open Questions

None blocking. The installed factory API remains a Phase 5 integration-test obligation.
