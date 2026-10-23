#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  tts|voices) command="$1"; shift ;;
  *) echo 'Usage: bash speech.sh {tts <script.md> <outDir>|voices [filter]}' >&2; exit 1 ;;
esac

exec envault run --manifest "$skill_dir/envault.toml" -- \
  node --disable-warning=ExperimentalWarning --experimental-strip-types \
  "$skill_dir/scripts/$command.ts" "$@"
