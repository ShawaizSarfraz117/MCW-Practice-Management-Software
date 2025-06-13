#!/bin/bash
# Cross-platform test runner wrapper

# Use the ultra parallel version
if command -v tsx &> /dev/null; then
    tsx scripts/test-runner-ultra-parallel.ts "$@"
elif command -v ts-node &> /dev/null; then
    ts-node scripts/test-runner-ultra-parallel.ts "$@"
else
    npx tsx scripts/test-runner-ultra-parallel.ts "$@"
fi