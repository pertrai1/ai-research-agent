# CG AgentFlow findings

## 2026-08-01 — `@cadmusgroup-llc/cg-agent-flow-agents@0.17.1`

- **Issue:** `createAgentFromFile`/`CreateAgentOptions` supports tool resolution but does not expose a provider factory or provider instance override. `ReActAgent` constructs its provider internally with `createProvider`.
- **Expected behavior:** Factory-created agents should accept an injected provider/factory so deterministic integration tests can use a fake provider and applications can supply controlled provider dependencies.
- **Evidence:** Installed `src/agent-factory.ts` defines `CreateAgentOptions` with `toolResolver` but no provider option; installed `src/react-agent.ts` calls `createProvider(this.llmConfig.model, { provider: this.llmConfig.provider })` inside `doRun`.
- **Impact:** Direct fake-provider tests cannot exercise the complete `createAgentFromFile` → `ReActAgent` path without using lifecycle hooks or patching the provider module. Runtime provider construction remains framework-controlled.
- **Workaround:** Use `beforeModelCall` lifecycle hooks for deterministic response injection in tests, and keep the production adapter on the documented factory path.
- **Status:** Open; integration test coverage added in Phase 5 should be revisited if the package adds provider injection.
