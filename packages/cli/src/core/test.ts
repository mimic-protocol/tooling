import * as path from 'path'

import { execBinCommand } from '../lib/packageManager'
import { defaultLogger } from '../log'

import { build } from './build'
import { TestError } from './errors'
import { BuildOptions, Logger, RunTestsOptions } from './types'

export function getTestPath(baseDir: string): string {
  return path.join(baseDir, 'tests', '**', '*.spec.ts')
}

export async function buildForTest(
  options: Omit<BuildOptions, 'confirmClean' | 'clean'>,
  logger: Logger = defaultLogger
): Promise<void> {
  await build(
    {
      ...options,
      clean: false,
    },
    logger
  )
}

export function runTests(options: RunTestsOptions, logger: Logger = defaultLogger): void {
  const { testPaths, baseDir } = options

  logger.startAction('Running tests')

  const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', ...testPaths], baseDir)

  const exitCode = result.status ?? 1
  const success = exitCode === 0

  logger.stopAction()

  if (!success) throw new TestError('Tests failed', exitCode, ['Check the test output for details'])
}
