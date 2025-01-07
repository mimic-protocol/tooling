#!/usr/bin/env node
import { executeTask } from '../src'

const dirArgIndex = process.argv.findIndex(arg => arg === '--dir')
if (dirArgIndex < 0 || !process.argv[dirArgIndex + 1]) {
  console.error('Usage: relayer --dir /path/to/example/build')
  process.exit(1)
}

const dir = process.argv[dirArgIndex + 1]
executeTask({ dir })
