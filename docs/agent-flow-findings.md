# CG AgentFlow findings

## 2026-08-01 — `@cadmusgroup-llc/cg-agent-flow-agents@0.17.1`

- **Issue:** `createAgentFromFile`/`CreateAgentOptions` supports tool resolution but does not expose a provider factory or provider instance override. `ReActAgent` constructs its provider internally with `createProvider`.
- **Expected behavior:** Factory-created agents should accept an injected provider/factory so deterministic integration tests can use a fake provider and applications can supply controlled provider dependencies.
- **Evidence:** Installed `src/agent-factory.ts` defines `CreateAgentOptions` with `toolResolver` but no provider option; installed `src/react-agent.ts` calls `createProvider(this.llmConfig.model, { provider: this.llmConfig.provider })` inside `doRun`.
- **Impact:** Direct fake-provider tests cannot exercise the complete `createAgentFromFile` → `ReActAgent` path without using lifecycle hooks or patching the provider module. Runtime provider construction remains framework-controlled.
- **Workaround:** Use `beforeModelCall` lifecycle hooks for deterministic response injection in tests, and keep the production adapter on the documented factory path.
- **Status:** Open; integration test coverage added in Phase 5 should be revisited if the package adds provider injection.

## 2026-08-01

### `@cadmusgroup-llc/cg-agent-flow-observability` 0.17.1: tracing hook type mismatch

- **Issue:** `createTracingHooks()` exposes callback parameter types from the observability package that are not assignable to the core package's exported `LifecycleHooks` under TypeScript `strict` mode with `exactOptionalPropertyTypes`; the optional `modelConfig` property differs in optionality and the message types are not identical.
- **Expected behavior:** The public tracing-hook return type should be assignable to `Partial<LifecycleHooks>` accepted by `BaseAgent.registerHooks`.
- **Evidence:** `npm run typecheck` failed when the showcase profile declared `hooks: Partial<LifecycleHooks>` and assigned `createTracingHooks({ tracer })`; the failure points to `beforeModelCall` and `modelConfig` optionality in package declarations.
- **Impact:** Consumers cannot type the factory-produced tracing hooks as core lifecycle hooks without an adapter boundary, despite the runtime hooks being compatible.
- **Workaround:** Keep the showcase profile's `hooks` property typed as `ReturnType<typeof createTracingHooks>` and pass it at the adapter boundary; do not widen production service types.
- **Status:** Open upstream discrepancy; workaround covered by the deterministic showcase typecheck/test.
