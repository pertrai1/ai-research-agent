---
name: adaptive-routing
description: Selects the lightest safe workflow path, relevant directives/skills, and handoff requirements based on task intent, risk, and touched surfaces.
version: 2.2.0
required: true
category: workflow
tools:
  - claude
  - copilot
  - codex
  - cursor
assets:
  - references/adaptive-routing-detail.md
triggers:
  - every-task
  - workflow-selection
  - directive-selection
routing:
  load: first
  applies_to:
    - implementation
    - debugging
    - review
    - exploration
    - policy-change
---

# Adaptive Workflow Routing Directive

Load this required bootstrap first for every task. Select the lightest workflow
that proves safety; load only the directives, skills, and rules the route needs.

## Fast decision

| Intent | Route | Next step / evidence |
| --- | --- | --- |
| Non-behavioral typo, wording, comment, formatting | Light | Minimal orientation, diff, relevant gate |
| Feature, behavior/API change, meaningful refactor | Full | Written spec before RED/edits; RED/GREEN; verification |
| Eligible 2–5 related low-risk behavioral fixes | Small Batch + Debugging + Full | Load detail; reproduce/root-cause/failing proof; one batch matrix and final gates |
| Bug, regression, failed check | Debugging + Full | Reproduce and record expected behavior before test/fix |
| Import/export/package/shared-code/path change | Boundary + base route | Classify edges, then complete the base-route spec gate |
| Directive, skill, workflow, repo-policy change | Policy + Full | Frame, Propose/Design/Specify, decision/version evidence |
| PR, branch, diff, local-change review | Review | Review only unless asked to fix |
| Investigation, explanation, PRD/spec, task planning | Exploration | Investigate or plan; do not implement |
| Shared, dirty, default-branch checkout | Base route + Workspace Isolation | Isolate or state a safe fallback |

**Specification gate:** Every implementation or behavior-changing task MUST have
a durable written specification before RED/GREEN or implementation edits.
Specification depth scales; its presence does not.

## Route disclosure

Report: `Route: <path>; using <directive/skill files>; rules: <rule files or
none>; evidence: <checks>.` For non-trivial, ambiguous, high-risk, or
cross-cutting work, also state intent, risk, selected files, handoff, and any
assumption/confirmation that changes safety or scope. Runtime loaded-file logs,
when available, are authoritative over self-report.

## Bootstrap composition

1. Start with project instructions. Choose the safest route when classification
   is uncertain; ask one concise question only when it changes safety or scope.
2. Combine every matching route. A bug with import changes is Debugging +
   Boundary; a policy change in a shared checkout adds Policy + Full +
   Workspace Isolation. Do not use Light for behavior, API, dependency,
   boundary, security, auth, data, or production work.
3. Full loads codebase navigation, specification-driven development, type-driven
   development for typed/public contracts, TDD for behavior changes,
   verification, and task framing when non-trivial. Debugging also loads
   systematic debugging before investigating and keeps reproduce → failing proof
   → fix → rerun order. Boundary loads architecture boundaries and its reviewer.
   Policy loads task framing, specification-driven development, verification,
   and durable decision/version rules. Workspace Isolation loads its directive.
4. Review loads code reviewer and matching reviewers; Exploration loads
   exploration mode plus planning/writing skills only when requested. Test or
   eval work loads test reviewer. Spec-governed merge work loads spec reviewer.
   TypeScript/JavaScript refactors or shared utilities load codebase-health
   reviewer. Match production, hooks, and MCP reviewers to their surfaces.
5. Load `directives/accessibility.md` for user-facing HTML, templates, UI
   components, forms, custom widgets, focus/keyboard behavior, ARIA, or frontend
   interaction tests/reviews. Do not load it for backend-only, CLI, migration, or
   docs-only work without a UI accessibility surface.
6. Select stack/file-scoped rules only after detecting project evidence and
   matching their `applies_to` scope and description. Use `manifest.json` as a
   compact discovery index when present; source frontmatter is authoritative.
7. Prefer the smallest safe change, evidence over ritual, and compact handoff
   at phase/session boundaries. Do not bulk-load unrelated directives or rules.

**Small Batch modifier:** It modifies, but never replaces, Full. Select it only
after the lazy detail confirms every eligibility condition for exactly two to
five closely related low-risk behavioral fixes. It always adds Debugging and
preserves reproduce → root-cause analysis → failing proof → fix → rerun order.
Add Workspace Isolation only when checkout state triggers it. Every other task
keeps the default no-batching workflow.

## Safety escalation

Add Full + production-readiness review for auth, permissions, security, privacy,
payments, data loss, persistence/migrations/queues, external services, async
jobs, infra/deploy, critical paths, performance/scale, or cross-service work.
Add agent permissions for protected files, risky commands, package operations,
secrets, CI, infra, deployment, or policy. Add Boundary for public APIs,
exports, packages, folders, services, shared utilities, or dependency direction.
Add adversarial review for explicit red-team work or broad/high-risk
agent-authored changes. Treat failed CI/test/build/lint/type checks as Debugging.

## Lazy routing reference

Obvious Light, Review, and Exploration tasks stop at this bootstrap. For
ambiguous, composite, high-risk, or any Full, Debugging, Boundary, Policy,
Workspace-Isolation, or Small Batch route, load the detailed companion before implementation or
merge readiness:

- Source tree: the relative companion reference is
  `references/adaptive-routing-detail.md`; its repository-root location is
  `directives/references/adaptive-routing-detail.md`.
- Installed tree: load
  `.agents/directives/references/adaptive-routing-detail.md`; deterministic sync
  installs it as this bootstrap's verified non-executable companion asset for
  Claude, Codex, Copilot, and Cursor. Cursor's bootstrap rule uses that stable
  `.agents/` path.

If the companion is absent, stale, tampered, unsafe, or conflicting, stop and
repair/re-sync it; do not infer detailed rules from a missing reference.

## Compact prohibitions

Do not let “quick” reduce safety, change code during Review/Exploration unless
asked, weaken tools to make them pass, silently broaden scope, or keep stale
handoffs as permanent context. Use verification for final project-native gates
and context handoff when switching major phases, delegating, or resuming long
work.
