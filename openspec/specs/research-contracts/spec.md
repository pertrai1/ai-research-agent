## Purpose

Define validated public research request, response, and structured model-output
boundaries before HTTP or agent integrations are introduced.

## Requirements

### Requirement: Research request contract

The system SHALL parse a future research request as a strict JSON object with a
required string topic and optional string session ID. It SHALL trim the topic,
reject an empty normalized topic, reject a normalized topic longer than 300
characters, and generate a session ID when one is absent.

#### Scenario: Request is normalized and assigned a session

- **WHEN** a request contains surrounding whitespace around a valid topic and no session ID
- **THEN** parsing returns the trimmed topic and the injected generated session ID

#### Scenario: Invalid request is rejected

- **WHEN** a request has an empty, oversized, or unsupported body shape
- **THEN** parsing returns a typed invalid-request result

### Requirement: Structured research response contract

The system SHALL parse a research response containing a normalized topic,
session ID, non-empty brief of at most 500 words, structured sources,
uncertainty indication, and run ID. It SHALL reject malformed model output
through a typed invalid-output result rather than a TypeScript assertion.

#### Scenario: Valid structured output is accepted

- **WHEN** a model output contains every required response field and a 500-word-or-shorter brief
- **THEN** the response parser returns the normalized structured response

#### Scenario: Invalid structured output is rejected

- **WHEN** model output is missing a required field, has an invalid source, or has more than 500 words
- **THEN** the parser returns `INVALID_AGENT_OUTPUT` without exposing raw input
