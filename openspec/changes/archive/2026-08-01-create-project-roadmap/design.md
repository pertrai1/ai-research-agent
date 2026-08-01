## Context

The repository currently has a comprehensive `REQUIREMENTS.md` and an OpenSpec configuration, but no implementation roadmap. The requirements span project foundations, validated contracts, two external-provider tools, agent behavior, memory, security, reliability, observability, HTTP delivery, deployment, and evaluation. Many controls are cross-cutting, and several requirements depend on foundations that must exist first.

The roadmap is for maintainers and implementation agents. It must be readable without prior session context, preserve `REQUIREMENTS.md` as the authoritative product contract, and turn that contract into work that can be completed and verified incrementally.

## Goals / Non-Goals

**Goals:**

- Produce one repository-level `ROADMAP.md` with dependency-ordered delivery phases.
- Give every phase a goal, requirement references, concrete checkbox tasks, and measurable exit criteria.
- Preserve test-driven delivery by pairing observable behavior with test-first tasks.
- Cover every functional, agent, security, reliability, observability, deployment, testing, and acceptance requirement.
- Make dependencies and release gates visible enough that implementation can proceed phase by phase.

**Non-Goals:**

- Implement application code, tests, infrastructure, or deployment configuration.
- Redefine, weaken, or expand the product scope in `REQUIREMENTS.md`.
- Estimate dates, staffing, story points, or calendar milestones without project evidence.
- duplicate the full prose of `REQUIREMENTS.md` inside the roadmap.
- Treat task completion alone as proof that a phase meets its exit criteria.

## Decisions

### 1. Organize phases by vertical dependency and risk

The roadmap will use ordered phases that establish foundations first, then deliver validated tools, agent orchestration, API/session behavior, production controls, and release verification. Security and testing tasks will appear in the phase where their related behavior is introduced instead of being deferred to a final hardening phase.

This is preferred over mirroring the numbered requirement sections because those sections describe concerns rather than an executable dependency graph. A single component-by-component checklist was also considered, but it would delay end-to-end validation and obscure integration risks.

### 2. Use stable requirement identifiers for traceability

Tasks and phase summaries will reference the identifiers already present in `REQUIREMENTS.md`, such as `FR-4`, `SEC-2`, and acceptance-criterion numbers. Requirements without formal short identifiers will be referenced by section number, for example `§8` or `§11.3`. A final coverage matrix will map each requirement family and all acceptance criteria to roadmap phases.

This is preferred over copying requirement text because references remain compact and discourage a second, divergent requirements source. References by section title alone were considered but are less precise and harder to audit.

### 3. Give every phase an explicit completion contract

Each phase will contain:

1. A concise outcome.
2. Dependencies on earlier phases.
3. Requirement references.
4. Checkbox tasks written as observable deliverables.
5. Exit criteria that can be verified with tests, inspection, or smoke checks.

Tasks will describe outcomes rather than speculative filenames unless `REQUIREMENTS.md` mandates a particular artifact. This keeps the roadmap useful before the application structure is designed.

### 4. Make test-first work part of each implementation slice

Where a phase introduces observable behavior, its task order will explicitly require a failing test, the smallest passing implementation, and green refactoring. Unit, integration, security, and evaluation coverage will be distributed alongside the capabilities they validate, with a final release phase responsible for complete-suite and deployed verification.

A standalone testing phase was rejected because it conflicts with the mandated TDD workflow in §11 and permits security or contract gaps to accumulate.

### 5. Keep the roadmap status-oriented but requirements-controlled

`ROADMAP.md` will use Markdown checkboxes so it can track progress in-place. Changes to task status may be made as work completes, but changes to scope must be reconciled with `REQUIREMENTS.md`; the roadmap cannot silently supersede a requirement. Newly discovered implementation work may be added under the applicable phase with its requirement reference or rationale.

### 6. Separate implementation phases from the OpenSpec change tasks

The OpenSpec `tasks.md` for this change will describe the work required to author and validate `ROADMAP.md`. The resulting `ROADMAP.md` will describe the much larger future implementation of the AI research agent. Keeping these two levels separate avoids falsely treating roadmap authorship as product implementation.

## Risks / Trade-offs

- **[Risk] The roadmap becomes a duplicate requirements document and drifts.** → Keep requirement text authoritative in `REQUIREMENTS.md`, use identifiers and a coverage matrix, and update both deliberately when scope changes.
- **[Risk] Broad phases hide tasks that are too large to execute.** → Break each phase into independently checkable tasks with a clear output or verification action.
- **[Risk] Security and operations are postponed behind feature work.** → Place relevant controls and tests in the same phase as each exposed boundary, then retain a final production gate.
- **[Risk] No time estimates make scheduling less explicit.** → Prefer dependency and exit-criteria clarity now; add estimates only when staffing and implementation evidence exist.
- **[Risk] Framework assumptions may change before implementation.** → Reference the documentation baseline in §15 and require version pinning plus integration verification when documented and installed behavior differ.
- **[Trade-off] A coverage matrix adds maintenance overhead.** → Accept the overhead because missing a security or acceptance requirement is materially more costly.

## Migration Plan

1. Create and validate the capability spec for the roadmap contract.
2. Create OpenSpec implementation tasks for drafting, auditing, and validating `ROADMAP.md`.
3. Generate `ROADMAP.md` from the approved artifacts and `REQUIREMENTS.md`.
4. Audit phase ordering, task actionability, and complete requirement coverage.
5. Treat removal of the new file as the rollback; no runtime or data migration is involved.

## Open Questions

None blocking. Dates, owners, and effort estimates can be added later when the project has staffing and delivery constraints.
