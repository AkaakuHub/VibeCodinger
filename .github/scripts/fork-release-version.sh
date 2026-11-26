#!/bin/sh
set -eu
base_version="$(node -p "require('./apps/desktop/package.json').version")"
printf '%s-pr.%s.%s\n' "${base_version%%-*}" "$GITHUB_RUN_NUMBER" "$GITHUB_RUN_ATTEMPT"
