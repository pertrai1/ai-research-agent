## 1. Research request and response contracts

- [x] 1.1 Add a failing request-contract test for normalization, limits, body shape, and generated session IDs.
- [x] 1.2 Implement the strict request parser and injected session-ID normalization helper.
- [x] 1.3 Add a failing structured response/model-output test for required fields and the 500-word boundary.
- [x] 1.4 Implement strict response schemas and the typed invalid-agent-output result.

## 2. Tool and provider contracts

- [x] 2.1 Add failing tests for bounded search input/results, Tavily payload rejection, and page-reader input/output.
- [x] 2.2 Implement strict search, provider, and page-reader parsers that project only documented fields.

## 3. Stable public failures

- [x] 3.1 Add failing tests for each error category's status/code mapping and sensitive-detail redaction.
- [x] 3.2 Implement the closed error vocabulary, mapper, and static public serializer.

## 4. Verification

- [x] 4.1 Refactor only where contract duplication is demonstrated while all focused tests remain green.
- [x] 4.2 Run OpenSpec validation and the repository typecheck, lint, formatting, test, and build gates.
