#!/usr/bin/env bash
# Installs ReproducerApp's dependencies and runs reproduce.js, which bundles
# enum/index.js with the app's Metro and Babel config and runs the bundle.
# Exit status: 1 while the Flow enum is dropped, 0 once it is declared,
# 2 when a step fails.
set -u

cd "$(dirname "$0")/ReproducerApp" || exit 2

echo '$ yarn install --frozen-lockfile'
if ! yarn install --frozen-lockfile --silent --non-interactive; then
  echo 'FAILED: yarn install'
  exit 2
fi

echo '$ node reproduce.js'
node reproduce.js
