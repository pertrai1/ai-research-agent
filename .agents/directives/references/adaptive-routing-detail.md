---
name: adaptive-routing-detail
description: Lazy companion detail for ambiguous, composite, and high-risk adaptive routing.
version: 1.3.0
required: false
category: workflow
tools:
  - claude
  - copilot
  - codex
  - cursor
---

# Adaptive Routing — Detailed Reference

Load this companion only when the bootstrap selects an ambiguous, composite,
high-risk, Full, Debugging, Boundary, Policy, Workspace-Isolation, or Small
Batch route. It expands the required bootstrap; it is not a separately required
directive.

## Full Path

Use for features, behavior/API changes, meaningful refactors, changed behavior
tests, and type/public-contract changes.

1. Orient with `directives/codebase-navigation.md`; inspect relevant error
   memory when `docs/ERRORS.md` applies.
2. For non-trivial, ambiguous, high-risk, or cross-cutting work, load
   `directives/task-framing.md` before substantial edits.
3. Load `directives/specification-driven-development.md` and create or identify
   the durable governing specification before RED or implementation. Then use
   type-driven development for typed/public contracts and TDD for behavior.
4. After REFACTOR, load `skills/self-audit/SKILL.md`, verify through
   `directives/verification.md`, run selected gates, and hand off when routed.

Load `skills/test-reviewer/SKILL.md` for changed tests/eval scenarios and
`skills/spec-reviewer/SKILL.md` before merge against a written contract.

## Small Batch Modifier

Small Batch is an orchestration-amortization modifier for Full, never a
specification-free, test-free, or lower-safety path. It is eligible only when
**every** proposed fix is a low-risk behavioral fix and all of these hold:

- The batch has **two through five** fixes, inclusive; one or six-or-more fixes
  are ineligible.
- The fixes are closely related, in one subsystem, and share one coherent
  outcome or root cause.
- One durable batch specification can enumerate every fix and non-goal with a
  binary acceptance-matrix row for each fix.
- The work fits one focused, reversible change and can be reviewed as one unit.

Small Batch is categorically ineligible for unrelated fixes and for every
Boundary, Policy, or Production trigger. This includes internal imports or
exports; shared utilities or modules; dependency-direction changes; public API
or package boundaries; auth, security, or privacy; persistence, data, or schema
migration; external services or async work; infrastructure or deployment; and
performance or critical paths. Route the affected work through the applicable
existing Full, Boundary, Policy, production-readiness, or other safety path.

Every eligible Small Batch fix unconditionally composes with Debugging, even
when the request does not call it a regression. Reproduce current behavior,
establish and document the coherent root cause and expected behavior, create the
complete failing proof, then implement the root-cause fix and rerun it.
Workspace Isolation is separate and conditional on checkout state: when the
checkout is shared, dirty, default/protected, or explicitly protected, establish
isolation and its baseline before mutation; otherwise reuse the verified safe
workspace. Small Batch never bypasses a triggered isolation obligation.

An eligible batch routes once. Before RED, write the one durable batch spec and
complete acceptance matrix.
One controlled multi-row RED is allowed only when it covers the complete scoped
matrix and every row fails for its expected reason. GREEN and REFACTOR remain
minimal and proceed one matrix row at a time, with focused proof for every row.
After all rows are proven, perform one batch self-audit, one verification
summary, and one canonical final project-gate run.

If eligibility fails, scope drifts, or unexpected coupling appears, stop the
batch non-destructively. Preserve valid evidence and isolate partial state;
update the specification for the remaining work, establish a new baseline, and
reroute before continuing. Never continue a batch by inertia.

## Debugging and Boundary

Debugging applies to regressions and failing CI/build/lint/type/test evidence.
Load `skills/systematic-debugging/SKILL.md`, reproduce first, record the brief
expected-behavior/regression specification, add or identify failing proof, fix
the root cause, rerun it, then verify. Use TDD when production behavior changes.

Boundary applies to imports/exports, folders/modules/packages, public entries,
shared utilities, services, or dependency direction. Load
`directives/architecture-boundaries.md` and
`skills/architecture-boundary-reviewer/SKILL.md`; show changed-edge evidence
before merge. Debugging plus Boundary follows reproduce → failing proof → fix →
rerun → boundary review.

## Policy and workspace isolation

Policy covers directives, skills, workflow, contributor instructions,
architecture policy, and cross-cutting conventions. Load task framing and
specification-driven development before edits. Existing changed directives and
skills require the mandated version bump; durable policy changes use
`directives/session-decisions.md`. Use verification and context handoff.

Workspace Isolation applies before mutation in shared, dirty, default/protected,
or explicitly protected checkouts. Load `directives/workspace-isolation.md`,
detect existing isolation, prefer native isolation, and show either isolated
workspace proof or an explicit safe fallback before edits.

## Review and exploration details

Review uses `skills/code-reviewer/SKILL.md`; add test, spec, boundary, health,
production, hooks, MCP, or adversarial reviewers only when their surfaces match.
Do not edit unless asked. Exploration uses `directives/exploration-mode.md` and
codebase navigation for repository evidence; add product-requirements writer or
implementation-task planner only for those artifacts. Do not implement until
the user switches modes.

## Surface-scoped directives

Load `directives/accessibility.md` when the touched surface is user-facing UI:
HTML templates, JSX/TSX, Vue, Svelte, Angular templates, forms, dialogs, modals,
popovers, menus, tabs, toasts, validation messages, focus behavior, keyboard
shortcuts, ARIA, images/icons, motion, or frontend interaction tests and reviews.
It composes with Full, Review, and test-review work. It does not apply to
backend-only logic, data migrations, CLI code, internal scripts, or docs-only
prose unless those changes alter UI accessibility requirements.

Use this as a directive for the accessibility floor on implementation, testing,
and review. For frontend files or user-facing UI, also load
`skills/a11y-expert/SKILL.md` for the specialist accessibility pass. The
specialist composes with the directive; it does not replace it. Do not load the
specialist for backend-only, CLI, migration, or docs-only work without a UI
surface.

## Specialist selection

| Trigger | Required specialist |
| --- | --- |
| Vague feature/requirement → PRD/spec | `skills/product-requirements-writer/SKILL.md` |
| PRD/issue/acceptance criteria → task plan | `skills/implementation-task-planner/SKILL.md` |
| Existing plan executed by delegated workers | `skills/subagent-driven-development/SKILL.md` |
| Bug/regression/failing gate | `skills/systematic-debugging/SKILL.md` |
| PR/branch/diff/local review | `skills/code-reviewer/SKILL.md` |
| Frontend files or user-facing UI | `skills/a11y-expert/SKILL.md` |
| Explicit adversarial or broad/high-risk agent change | `skills/adversarial-reviewer/SKILL.md` |
| Tests or eval scenarios | `skills/test-reviewer/SKILL.md` |
| Spec-governed implementation/merge | `skills/spec-reviewer/SKILL.md` |
| Imports/exports/packages/shared code | `skills/architecture-boundary-reviewer/SKILL.md` |
| TS/JS refactor, cleanup, shared utilities | `skills/codebase-health-reviewer/SKILL.md` |
| Production-sensitive surface | `skills/production-readiness-reviewer/SKILL.md` |
| Harness hooks/deterministic automation | `skills/harness-hooks-reviewer/SKILL.md` |
| MCP/tool/API bridge | `skills/mcp-integration-reviewer/SKILL.md` |

## Risk and evidence rules

Escalate rather than downgrade for public APIs, data/security/auth, production
systems, shared boundaries, CI failures, broad refactors, and uncertainty.
Run the project-native gates selected by the route, fix root causes rather than
suppressing tools, and classify pre-existing/out-of-scope failures explicitly.
Keep implementation bounded: no drive-by formatting, unrelated cleanup,
speculative abstractions, or permanent handoff accumulation.
