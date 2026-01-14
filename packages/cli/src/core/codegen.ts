import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'
import { ZodError } from 'zod'

import { DuplicateEntryError, EmptyManifestError, MoreThanOneEntryError } from '../errors'
import { AbisInterfaceGenerator, InputsInterfaceGenerator } from '../lib'
import { defaultLogger } from '../log'
import { Manifest } from '../types'
import { ManifestValidator } from '../validators'

import { CodegenError, FileNotFoundError, ManifestValidationError } from './errors'
import { CodegenOptions, CommandResult, Logger } from './types'

export function loadManifest(manifestPath: string): Manifest {
  if (!fs.existsSync(manifestPath)) {
    throw new FileNotFoundError(manifestPath, ['Use the -m or --manifest flag to specify the correct path'])
  }

  let loadedManifest
  try {
    loadedManifest = load(fs.readFileSync(manifestPath, 'utf-8'))
  } catch {
    throw new FileNotFoundError(manifestPath, [
      'Could not read or parse the manifest file',
      'Ensure the file is valid YAML',
    ])
  }

  try {
    return validateManifest(loadedManifest)
  } catch (err) {
    throw convertManifestError(err)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateManifest(manifest: any): Manifest {
  if (!manifest) throw new EmptyManifestError()

  const mergedManifest = {
    ...manifest,
    inputs: mergeIfUnique(manifest.inputs),
    abis: mergeIfUnique(manifest.abis),
    metadata: { libVersion: getLibVersion() },
  }
  return ManifestValidator.parse(mergedManifest)
}

function mergeIfUnique(list: Record<string, unknown>[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const obj of list || []) {
    const entries = Object.entries(obj)
    if (entries.length !== 1) throw new MoreThanOneEntryError(entries)
    const [key, val] = entries[0]
    if (key in merged) throw new DuplicateEntryError(key)
    merged[key] = val
  }
  return merged
}

function getLibVersion(): string {
  let currentDir = process.cwd()
  while (currentDir !== path.dirname(currentDir)) {
    const libPackagePath = path.join(currentDir, 'node_modules', '@mimicprotocol', 'lib-ts', 'package.json')
    if (fs.existsSync(libPackagePath)) {
      try {
        return JSON.parse(fs.readFileSync(libPackagePath, 'utf-8')).version
      } catch (error) {
        throw new Error(`Failed to read @mimicprotocol/lib-ts version: ${error}`)
      }
    }
    currentDir = path.dirname(currentDir)
  }
  throw new Error('Could not find @mimicprotocol/lib-ts package')
}

function convertManifestError(err: unknown): ManifestValidationError {
  if (err instanceof MoreThanOneEntryError) {
    return new ManifestValidationError(err.message, [
      `${err.location[1][0]}: ${err.location[1][1]} might be missing a prepended '-' on manifest`,
    ])
  }
  if (err instanceof DuplicateEntryError) {
    return new ManifestValidationError(err.message, [`Review manifest for duplicate key: ${err.duplicateKey}`])
  }
  if (err instanceof EmptyManifestError) {
    return new ManifestValidationError(err.message, ['Verify if you are using the correct manifest file'])
  }
  if (err instanceof ZodError) {
    return new ManifestValidationError(
      'Missing/Incorrect Fields',
      err.errors.map((e) => `Fix Field "${e.path.join('.')}" -- ${e.message}`)
    )
  }
  return new ManifestValidationError(`Unknown Error: ${err}`)
}

function generateAbisCode(manifest: Manifest, outputDir: string, manifestDir: string): void {
  for (const [contractName, abiRelativePath] of Object.entries(manifest.abis)) {
    const abiPath = path.join(manifestDir, '../', abiRelativePath)
    if (!fs.existsSync(abiPath)) {
      throw new CodegenError(`ABI file not found: ${abiPath}`, [
        `Ensure the ABI file exists at: ${abiRelativePath}`,
        'Check the paths in your manifest.yaml',
      ])
    }

    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'))
    const abiInterface = AbisInterfaceGenerator.generate(abi, contractName)
    if (abiInterface.length > 0) {
      const outputPath = `${outputDir}/${contractName}.ts`
      fs.writeFileSync(outputPath, abiInterface)
    }
  }
}

function generateInputsCode(manifest: Manifest, outputDir: string): void {
  const inputsInterface = InputsInterfaceGenerator.generate(manifest.inputs)

  if (inputsInterface.length > 0) {
    const outputPath = `${outputDir}/index.ts`
    fs.writeFileSync(outputPath, inputsInterface)
  }
}

export async function codegen(options: CodegenOptions, logger: Logger = defaultLogger): Promise<CommandResult> {
  const { manifestPath, outputDir, clean, confirmClean } = options

  const manifest = loadManifest(manifestPath)

  if (clean) {
    if (confirmClean) {
      const shouldDelete = await confirmClean()
      if (!shouldDelete) return { success: false }
    }

    logger.startAction(`Deleting contents of ${outputDir}`)
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true })
  }

  logger.startAction('Generating code')

  if (Object.keys(manifest.inputs).length === 0 && Object.keys(manifest.abis).length === 0) {
    logger.stopAction()
    return { success: true }
  }

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  generateAbisCode(manifest, outputDir, manifestPath)
  generateInputsCode(manifest, outputDir)

  logger.stopAction()

  return { success: true }
}
