## ADDED Requirements

### Requirement: Reproducible TypeScript project commands

The repository SHALL declare Node.js 24 and npm 9-or-later expectations and SHALL provide `typecheck`, `lint`, `format:check`, `test`, `build`, and `start` commands. The build SHALL compile the minimal TypeScript service entry point to a production artifact.

#### Scenario: Clean supported-runtime validation

- **WHEN** a contributor installs dependencies from the committed lockfile on Node.js 24
- **THEN** type checking, linting, formatting verification, unit tests, and the production build complete successfully without provider credentials

#### Scenario: Built service starts locally

- **WHEN** a contributor runs the documented start command after a successful build in local mode
- **THEN** the compiled minimal service entry point starts without requiring Anthropic or Tavily credentials

### Requirement: Safe environment configuration boundary

The application SHALL parse its environment through a Zod-backed loader. Production mode SHALL require non-empty `ANTHROPIC_API_KEY` and `TAVILY_API_KEY`; local mode SHALL permit their absence. Invalid configuration errors SHALL identify only field names and validation reasons and SHALL NOT contain supplied secret values.

#### Scenario: Production secrets are missing

- **WHEN** production configuration is loaded without either required provider key
- **THEN** the loader returns a clear validation failure naming the missing fields and containing neither secret values nor raw environment data

#### Scenario: Malformed supplied value is rejected safely

- **WHEN** configuration receives an invalid typed value together with representative secret strings
- **THEN** the loader rejects the value and its error text contains none of the representative secret strings

### Requirement: Credential-free package and ignore configuration

The tracked npm configuration SHALL map the `@cadmusgroup-llc` scope to `https://npm.pkg.github.com` without a literal credential. Git ignore rules SHALL exclude credential-bearing local npm configuration, `.env` files, dependencies, build output, test output, and coverage.

#### Scenario: Repository configuration is inspected

- **WHEN** a reviewer inspects tracked npm and ignore configuration
- **THEN** the package scope is configured, no literal token is present, and every required sensitive or generated path is ignored

### Requirement: Pinned AgentFlow dependency evidence

The project SHALL pin the required `@cadmusgroup-llc/cg-agent-flow-*` packages at exact versions once registry metadata is accessible. Documentation SHALL identify the package names, state any documentation/package discrepancy, and require an integration test of the installed factory API before Phase 5 agent assembly.

#### Scenario: Package access is unavailable

- **WHEN** no authorized GitHub Packages credential is available during local setup
- **THEN** setup fails transparently without substituting a differently named or public package, and the documented integration-test follow-up remains visible

### Requirement: Deterministic CI quality gates

GitHub Actions SHALL use Node.js 24, install from the committed lockfile, inject GitHub Packages credentials from a secret, and run type checking, linting, unit tests, and the production build.

#### Scenario: CI executes the foundation gates

- **WHEN** the CI workflow runs with its package-read secret configured
- **THEN** it uses lockfile installation and executes the typecheck, lint, test, and build commands without writing the secret to repository files or logs
