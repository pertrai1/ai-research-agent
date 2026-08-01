## 1. Toolchain and repository safety

- [x] 1.1 Replace the stub package manifest with exact Node 24-compatible TypeScript, Vitest, ESLint, Prettier, Zod, and lint-plugin dependencies plus typecheck, lint, format, test, build, and start scripts.
- [x] 1.2 Add TypeScript, ESLint, Prettier, and Vitest configuration and a minimal compiled service entry point.
- [x] 1.3 Add token-free GitHub Packages scope configuration and ignore rules for local credentials, environment files, dependencies, generated output, test output, and coverage.
- [x] 1.4 Document supported runtime, commands, local package authentication, and the no-secret repository rule.

## 2. Environment boundary (test-first)

- [x] 2.1 Add deterministic failing tests for local defaults, missing production secrets, malformed values, and redaction of representative secret strings.
- [x] 2.2 Implement the smallest Zod-backed `loadEnvironment` result and sanitized error representation that passes the focused suite.
- [x] 2.3 Connect the minimal service entry point to the environment loader without reading provider secrets elsewhere, then refactor while the suite remains green.

## 3. Dependency and CI evidence

- [x] 3.1 Retrieve authorized GitHub Packages metadata, pin every required CG AgentFlow package at an exact version, and generate the committed lockfile; if access is unavailable, preserve the transparent failure and documented integration-test follow-up.
- [x] 3.2 Add a GitHub Actions workflow using Node 24, `npm ci`, injected `read:packages` secret configuration, and the typecheck, lint, test, and build gates.
- [x] 3.3 Add documentation for the AgentFlow package/documentation evidence and Phase 5 factory integration test requirement.

## 4. Verification and roadmap status

- [x] 4.1 Run focused environment tests, then typecheck, lint, formatting check, full tests, and production build on the available supported runtime; record any external credential limitation distinctly.
- [x] 4.2 Inspect tracked configuration for literal credentials, validate the OpenSpec change, and update Phase 1 roadmap checkboxes only for completed tasks.
