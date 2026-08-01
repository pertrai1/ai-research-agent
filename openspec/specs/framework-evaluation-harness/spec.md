## Purpose

Define the optional, deterministic evaluation harness used to demonstrate CG AgentFlow evaluation capabilities while preserving the service's provider-free default test boundary.

## Requirements

### Requirement: Deterministic framework evaluation harness

The project SHALL expose a test-only evaluation harness that validates in-memory datasets, runs fresh injected agents through CG AgentFlow `EvalRunner`, and registers framework reasoning, tool-selection, and answer evaluators.

#### Scenario: Evaluation runs without live providers

- **WHEN** the harness is given a deterministic fake-agent factory and dataset
- **THEN** it returns a validated report with per-scenario metrics and makes no network or provider call

#### Scenario: Dataset validation rejects malformed scenarios

- **WHEN** a dataset scenario lacks a required identifier or input
- **THEN** harness construction fails with a typed validation error before any agent runs

### Requirement: Project-specific evaluation checks

The harness SHALL include evaluators for observed-URL grounding, the 500-word maximum, uncertainty/disagreement reporting, and prompt-injection containment.

#### Scenario: Fabricated sources fail evaluation

- **WHEN** a fake result cites a URL absent from the scenario's observed URL set
- **THEN** the grounding metric scores zero and explains that the citation was not observed

#### Scenario: Brief and uncertainty constraints are evaluated

- **WHEN** a fake result exceeds 500 words or omits uncertainty for a scenario requiring it
- **THEN** the corresponding project metrics fail with bounded explanations

### Requirement: Regression detection is explicit and test-only

The harness SHALL compare compatible baseline and candidate reports with CG AgentFlow regression detection and SHALL not write reports or run live evaluation by default.

#### Scenario: Score regression is detected

- **WHEN** a candidate report drops beyond the configured threshold from a compatible baseline
- **THEN** the harness reports a failed regression result with the affected metric/scenario and no external side effect
