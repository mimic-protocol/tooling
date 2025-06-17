import { Command } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'
import { ZodError } from 'zod'

import { DuplicateEntryError, EmptyManifestError, MoreThanOneEntryError } from '../errors'
import { Manifest } from '../types'
import { ManifestValidator } from '../validators'

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(manifest: any): Manifest {
    if (!manifest) throw new EmptyManifestError()

    const mergedManifest = {
      ...manifest,
      libVersion: getLibVersion(),
      inputs: mergeIfUnique(manifest.inputs),
      abis: mergeIfUnique(manifest.abis),
    }
    return ManifestValidator.parse(mergedManifest)
  },

  load(command: Command, manifestDir: string): Manifest {
    let loadedManifest
    try {
      loadedManifest = load(fs.readFileSync(manifestDir, 'utf-8'))
    } catch {
      command.error(`Could not find ${manifestDir}`, {
        code: 'FileNotFound',
        suggestions: ['Use the -m or --manifest flag to specify the correct path'],
      })
    }

    try {
      return this.validate(loadedManifest)
    } catch (err) {
      handleValidationError(command, err)
    }
  },
}

function mergeIfUnique(list: Record<string, unknown>[]) {
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

function handleValidationError(command: Command, err: unknown): never {
  let message: string
  let code: string
  let suggestions: string[]

  if (err instanceof MoreThanOneEntryError) {
    ;[message, code] = [err.message, err.name]
    suggestions = [`${err.location[1][0]}: ${err.location[1][1]} might be missing a prepended '-' on manifest`]
  } else if (err instanceof DuplicateEntryError) {
    ;[message, code] = [err.message, err.name]
    suggestions = [`Review manifest for duplicate key: ${err.duplicateKey}`]
  } else if (err instanceof EmptyManifestError) {
    ;[message, code] = [err.message, err.name]
    suggestions = ['Verify if you are using the correct manifest file']
  } else if (err instanceof ZodError) {
    ;[message, code] = ['Missing/Incorrect Fields', 'FieldsError']
    suggestions = err.errors.map((e) => `Fix Field "${e.path.join('.')}" -- ${e.message}`)
  } else {
    ;[message, code] = [`Unkown Error: ${err}`, 'UnknownError']
    suggestions = [
      'Contact the Mimic team for further assistance at our website https://www.mimic.fi/ or discord https://discord.com/invite/cpcyV9EsEg',
    ]
  }

  command.error(message, { code, suggestions })
}

function getLibVersion(): string {
  const libPackageDir = ['node_modules', '@mimicprotocol', 'lib-ts', 'package.json']
  try {
    // Strategy 1: Look for lib-ts from current working directory (external projects)
    const packagePath = path.resolve(process.cwd(), ...libPackageDir)
    if (fs.existsSync(packagePath)) return getVersionFromPackage(packagePath)

    // Strategy 2: Look for workspace root (development environment)
    let currentDir = __dirname
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        if (packageJson.workspaces) {
          const libPackagePath = path.join(currentDir, ...libPackageDir)
          if (fs.existsSync(libPackagePath)) return getVersionFromPackage(libPackagePath)
        }
      }
      currentDir = path.dirname(currentDir)
    }

    throw new Error('Could not find @mimicprotocol/lib-ts package')
  } catch (error) {
    throw new Error(`Failed to read @mimicprotocol/lib-ts version: ${error}`)
  }
}

function getVersionFromPackage(packagePath: string): string {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  return packageJson.version
}
