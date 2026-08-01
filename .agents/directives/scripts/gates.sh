#!/usr/bin/env bash
#
# gates.sh — detect and run this project's quality gates, failures-only.
#
# Referenced by: verification.md as the canonical final quality-gate helper.
# Replaces re-deriving the commands and pasting full logs with one capped,
# deterministic report.
#
# Why a script: the gate commands are re-discovered every session and the raw
# output is unbounded. This detects the stack once, runs each gate, collapses a
# passing gate to a single line, and caps a failing gate to its last N lines
# (where the actual error usually is) so a 3000-line suite can't flood context.
#
# Usage:
#   bash gates.sh [gate ...]     # gate in: lint typecheck test build static-analysis (default: all detected)
#   MAX_LINES=200 bash gates.sh  # override the per-failure line cap (default 150)
#
# Exit code: 0 if every run gate passed, 1 if any failed (usable in CI/hooks).
set -uo pipefail

MAX_LINES="${MAX_LINES:-150}"
WANT=("$@")               # optional subset of gates to run
FAILED=0
RAN=0
RAN_LINT=0
RAN_TYPECHECK=0
RAN_TEST=0
RAN_BUILD=0
RAN_STATIC_ANALYSIS=0

case "$MAX_LINES" in
  ''|*[!0-9]*)
    echo "MAX_LINES must be a positive integer" >&2
    exit 2
    ;;
esac
if [ "$MAX_LINES" -lt 1 ]; then
  echo "MAX_LINES must be a positive integer" >&2
  exit 2
fi

# want <gate> → true if the user requested this gate (or requested nothing).
want() {
  [ "${#WANT[@]}" -eq 0 ] && return 0
  local g
  for g in "${WANT[@]}"; do [ "$g" = "$1" ] && return 0; done
  return 1
}

# run_check <label> <cmd...> → PASS collapses to one line; FAIL shows tail.
run_check() {
  local label="$1"; shift
  RAN=$((RAN + 1))
  printf '## %s\n```text\n' "$label"
  local output status
  output="$("$@" 2>&1)"; status=$?
  if [ "$status" -eq 0 ]; then
    echo "STATUS: PASS  ($*)"
  else
    echo "$ ${*}"
    echo "$output" | tail -n "$MAX_LINES"
    echo "STATUS: FAIL (exit $status)"
    FAILED=1
  fi
  printf '```\n\n'
}

# npm_script <name> → true if package.json defines that script.
npm_script() {
  node -e 'process.exit((require("./package.json").scripts||{})["'"$1"'"]?0:1)' 2>/dev/null
}

echo "# Quality Gates"
echo

if [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  NPM_AGGREGATE=0
  if [ "${#WANT[@]}" -eq 0 ]; then
    if npm_script verify; then
      run_check "verify" npm run verify --silent
      NPM_AGGREGATE=1
    elif npm_script check; then
      run_check "check" npm run check --silent
      NPM_AGGREGATE=1
    fi
  fi

  if [ "$NPM_AGGREGATE" -eq 0 ]; then
    # Map conventional gate names to whatever the project actually defines.
    want lint     && { npm_script lint     && { run_check "lint" npm run lint --silent; RAN_LINT=1; }; }
    want static-analysis && {
      if   npm_script static-analysis; then run_check "static-analysis" npm run static-analysis --silent; RAN_STATIC_ANALYSIS=1
      elif npm_script static:analysis; then run_check "static-analysis" npm run static:analysis --silent; RAN_STATIC_ANALYSIS=1
      elif npm_script analyze        ; then run_check "static-analysis" npm run analyze --silent; RAN_STATIC_ANALYSIS=1
      fi
    }
    want typecheck && {
      if   npm_script typecheck  ; then run_check "typecheck" npm run typecheck --silent; RAN_TYPECHECK=1
      elif npm_script type-check ; then run_check "typecheck" npm run type-check --silent; RAN_TYPECHECK=1
      fi
    }
    want test  && { npm_script test  && { run_check "test" npm test --silent; RAN_TEST=1; }; }
    want build && { npm_script build && { run_check "build" npm run build --silent; RAN_BUILD=1; }; }
  fi
fi

if [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  want lint      && command -v ruff   >/dev/null 2>&1 && { run_check "ruff" ruff check .; RAN_LINT=1; }
  want typecheck && command -v mypy   >/dev/null 2>&1 && { run_check "mypy" mypy .; RAN_TYPECHECK=1; }
  want test      && command -v pytest >/dev/null 2>&1 && { run_check "pytest" pytest -q; RAN_TEST=1; }
fi

if [ -f go.mod ] && command -v go >/dev/null 2>&1; then
  want lint  && { run_check "go vet" go vet ./...; RAN_LINT=1; }
  want build && { run_check "go build" go build ./...; RAN_BUILD=1; }
  want test  && { run_check "go test" go test ./...; RAN_TEST=1; }
fi

if [ -f Cargo.toml ] && command -v cargo >/dev/null 2>&1; then
  want lint  && { run_check "clippy" cargo clippy -- -D warnings; RAN_LINT=1; }
  want test  && { run_check "cargo test" cargo test; RAN_TEST=1; }
  want build && { run_check "cargo build" cargo build; RAN_BUILD=1; }
fi

if [ "${#WANT[@]}" -gt 0 ]; then
  for requested in "${WANT[@]}"; do
    case "$requested" in
      lint)      ran="$RAN_LINT" ;;
      typecheck) ran="$RAN_TYPECHECK" ;;
      test)      ran="$RAN_TEST" ;;
      build)     ran="$RAN_BUILD" ;;
      static-analysis) ran="$RAN_STATIC_ANALYSIS" ;;
      *)         ran=0 ;;
    esac
    if [ "$ran" -eq 0 ]; then
      echo "Unavailable requested gate: $requested" >&2
      FAILED=1
    fi
  done
fi

if [ "$RAN" -eq 0 ]; then
  if [ "$FAILED" -ne 0 ]; then
    echo "SUMMARY: no requested gates could be run."
    exit 1
  fi
  echo "No gates detected (no recognized package.json/pyproject/go.mod/Cargo.toml gate)."
  echo "Run your project's test/lint/build commands directly."
  exit 0
fi

echo "SUMMARY: $RAN gate(s) run, $([ "$FAILED" -eq 0 ] && echo 'all passed' || echo 'FAILURES above')."
exit "$FAILED"
