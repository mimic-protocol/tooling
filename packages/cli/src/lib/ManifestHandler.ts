import { Command } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'
import * as semver from 'semver'
import { ZodError } from 'zod'

import { DuplicateEntryError, EmptyManifestError, MoreThanOneEntryError } from '../errors'
import { Manifest } from '../types'
import { LibRunnerMappingValidator, ManifestValidator } from '../validators'

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(manifest: any): Manifest {
    if (!manifest) throw new EmptyManifestError()

    const mergedManifest = {
      ...manifest,
      inputs: mergeIfUnique(manifest.inputs),
      abis: mergeIfUnique(manifest.abis),
      metadata: { runnerVersion: getRunnerVersion(getLibVersion()) },
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
  try {
    let currentDir = process.cwd()
    while (currentDir !== path.dirname(currentDir)) {
      const libPackagePath = path.join(currentDir, 'node_modules', '@mimicprotocol', 'lib-ts', 'package.json')
      if (fs.existsSync(libPackagePath)) return JSON.parse(fs.readFileSync(libPackagePath, 'utf-8')).version
      currentDir = path.dirname(currentDir)
    }

    throw new Error('Could not find @mimicprotocol/lib-ts package')
  } catch (error) {
    throw new Error(`Failed to read @mimicprotocol/lib-ts version: ${error}`)
  }
}

export function getRunnerVersion(libVersion: string, mappingPath?: string): string {
  try {
    let finalMappingPath = mappingPath

    if (!finalMappingPath) {
      let currentDir = process.cwd()
      while (currentDir !== path.dirname(currentDir)) {
        const distMappingPath = path.join(
          currentDir,
          'node_modules',
          '@mimicprotocol',
          'cli',
          'dist',
          'lib-runner-mapping.yaml'
        )
        if (fs.existsSync(distMappingPath)) {
          finalMappingPath = distMappingPath
          break
        }
        currentDir = path.dirname(currentDir)
      }

      if (!finalMappingPath) throw new Error('Could not find @mimicprotocol/cli package with lib-runner-mapping.yaml')
    }

    const mappingContent = fs.readFileSync(finalMappingPath, 'utf-8')
    const mapping = LibRunnerMappingValidator.parse(load(mappingContent))

    for (const entry of mapping) {
      if (semver.satisfies(libVersion, entry.libVersionRange)) {
        return entry.runnerVersion
      }
    }

    throw new Error(`No runner version mapping found for lib-ts version ${libVersion}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('No runner version mapping found')) {
      throw error
    }
    if (error instanceof Error && error.message.includes('Could not find @mimicprotocol/cli package')) {
      throw error
    }
    throw new Error(`Failed to read lib-runner-mapping.yaml from @mimicprotocol/cli: ${error}`)
  }
}
