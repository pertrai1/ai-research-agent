## Purpose

Define the optional YAML-backed guardrail demonstration for the read-only research agent.

## Requirements

### Requirement: YAML-backed deterministic guardrails

The showcase agent SHALL load guardrail declarations from a validated YAML spec and resolve only the framework `PromptInjectionGuardrail`, `SecretsRedactionGuardrail`, and `OutputValidationGuardrail` types with direction-compatible configuration.

#### Scenario: Showcase spec declares the approved guardrails

- **WHEN** the showcase YAML is loaded
- **THEN** it declares input prompt-injection protection and output secret-redaction plus output-validation protection, with a fail-fast pipeline and no unregistered tools

#### Scenario: Unknown guardrail is rejected

- **WHEN** the showcase resolver receives an unknown type or a known type in an incompatible direction
- **THEN** it returns no guardrail and the showcase agent refuses incomplete configuration rather than silently broadening the allow-list

### Requirement: Guardrail behavior is deterministic and defense in depth

The showcase SHALL demonstrate that prompt injection can be blocked, output secrets can be redacted or blocked according to YAML configuration, and invalid/oversized output is rejected while application validation remains authoritative.

#### Scenario: Injection-like input is blocked

- **WHEN** a prompt contains a recognized instruction-override pattern
- **THEN** the input guardrail returns a blocking result without invoking a provider or tool

#### Scenario: Secret output is transformed safely

- **WHEN** output contains a configured secret pattern
- **THEN** the output guardrail returns the configured redacted text and the original secret is absent from the transformed result

#### Scenario: Invalid output is blocked

- **WHEN** output exceeds the configured maximum or matches a forbidden pattern
- **THEN** the output guardrail returns a blocking result and the invalid output is not accepted as a successful showcase result
