#!/bin/sh
set -e

echo "Container's IP address: `awk 'END{print $1}' /etc/hosts`"

cd /backend/external

pnpm install --no-frozen-lockfile
pnpm build

mkdir -p ../out
mv dist ../out/external
