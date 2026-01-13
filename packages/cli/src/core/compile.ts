import * as fs from 'fs'
import * as path from 'path'

import { execBinCommand } from '../lib/packageManager'
import { defaultLogger } from '../log'

import { loadManifest } from './codegen'
import { CompilationError, FileNotFoundError } from './errors'
import { CompileOptions, CompileResult, Logger } from './types'

export async function compile(options: CompileOptions, logger: Logger = defaultLogger): Promise<CompileResult> {
  const { manifestPath, taskPath, outputDir, cwd = process.cwd() } = options

  const resolvedTaskPath = path.resolve(taskPath)
  const resolvedOutputDir = path.resolve(outputDir)

  if (!fs.existsSync(resolvedTaskPath)) {
    throw new FileNotFoundError(resolvedTaskPath, [
      'Use the -t or --task flag to specify the correct path',
      `Expected task file at: ${taskPath}`,
    ])
  }

  if (!fs.existsSync(resolvedOutputDir)) fs.mkdirSync(resolvedOutputDir, { recursive: true })

  logger.startAction('Verifying Manifest')
  const manifest = loadManifest(manifestPath)

  logger.startAction('Compiling')

  const wasmPath = path.join(resolvedOutputDir, 'task.wasm')
  const ascArgs = [
    resolvedTaskPath,
    '--target',
    'release',
    '--outFile',
    wasmPath,
    '--optimize',
    '--exportRuntime',
    '--transform',
    'json-as/transform',
  ]

  const result = execBinCommand('asc', ascArgs, cwd)
  if (result.status !== 0) {
    throw new CompilationError('AssemblyScript compilation failed', [
      'Check the AssemblyScript file for syntax errors',
      'Ensure all dependencies are installed',
    ])
  }

  logger.startAction('Saving files')
  const manifestJsonPath = path.join(resolvedOutputDir, 'manifest.json')
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2))

  logger.stopAction()

  return {
    wasmPath,
    manifestJsonPath,
    success: true,
  }
}
