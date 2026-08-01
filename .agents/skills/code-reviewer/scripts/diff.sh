#!/usr/bin/env bash
#
# diff.sh — scoped, noise-filtered, per-file-capped review diff.
#
# Referenced by: code-reviewer/SKILL.md (and reusable by the other reviewer
#                skills + verification.md's "Files changed"). Gives the reviewer
#                exactly what changed without re-reading whole files, with
#                lockfiles/generated/build output excluded and each file's diff
#                capped so one large rewrite can't dominate context.
#
# Usage:
#   bash diff.sh [base]     # default base: auto (origin/main, else main, else HEAD)
#   bash diff.sh --staged   # review staged changes only
#   bash diff.sh --working  # review all uncommitted changes (staged + unstaged)
#
# MAX_LINES per-file cap (default 150).
set -uo pipefail

MAX_LINES="${MAX_LINES:-150}"

EXCLUDES=(
  ':(exclude)*.lock' ':(exclude)package-lock.json' ':(exclude)yarn.lock'
  ':(exclude)pnpm-lock.yaml' ':(exclude)*.svg' ':(exclude)dist/**'
  ':(exclude)build/**' ':(exclude)*.min.js' ':(exclude)*.map'
)

MODE="range"
BASE=""
case "${1:-}" in
  --staged)  MODE="staged" ;;
  --working) MODE="working" ;;
  "" )       MODE="range" ;;
  * )        MODE="range"; BASE="$1" ;;
esac

if [ "$MODE" = "range" ] && [ -z "$BASE" ]; then
  if   git rev-parse --verify -q origin/main >/dev/null; then BASE="origin/main"
  elif git rev-parse --verify -q main        >/dev/null; then BASE="main"
  else BASE="HEAD"; fi
fi

# cap_per_file: split a multi-file diff on "diff --git" and cap each hunk-set.
cap_per_file() {
  awk -v max="$MAX_LINES" '
    function flush() {
      if (buf=="") return
      n=split(buf, a, "\n")
      lim=(n>max)?max:n
      for (i=1;i<=lim;i++) print a[i]
      if (n>max) print "... [" (n-max) " more lines in this file diff omitted] ..."
    }
    /^diff --git/ { flush(); buf=$0"\n"; next }
    { buf=buf $0 "\n" }
    END { flush() }
  '
}

echo "# Review Diff"
case "$MODE" in
  staged)  echo "(staged changes)"; RANGE=(--cached) ;;
  working) echo "(all uncommitted changes)"; RANGE=(HEAD) ;;
  range)   echo "(vs $BASE)"; RANGE=("${BASE}...HEAD") ;;
esac
echo

untracked_files() {
  git ls-files --others --exclude-standard -- . "${EXCLUDES[@]}"
}

print_untracked_name_status() {
  [ "$MODE" = "working" ] || return 0
  untracked_files | while IFS= read -r file; do
    printf 'A\t%s\n' "$file"
  done
}

print_untracked_diff() {
  [ "$MODE" = "working" ] || return 0
  untracked_files | while IFS= read -r file; do
    git diff --no-index -- /dev/null "$file"
    status=$?
    [ "$status" -le 1 ] || return "$status"
  done
}

echo "## Changed files"
git diff --name-status "${RANGE[@]}" -- . "${EXCLUDES[@]}"
print_untracked_name_status
echo

echo "## Stat"
git diff --stat "${RANGE[@]}" -- . "${EXCLUDES[@]}"
if [ "$MODE" = "working" ]; then
  untracked_files | while IFS= read -r file; do
    git diff --no-index --stat -- /dev/null "$file"
    status=$?
    [ "$status" -le 1 ] || exit "$status"
  done
fi
echo

echo "## Full diff (per-file capped)"
{
  git diff --find-renames --find-copies "${RANGE[@]}" -- . "${EXCLUDES[@]}"
  print_untracked_diff
} | cap_per_file
