import { RUNNER_TARGET_VERSION } from '@mimicprotocol/lib-ts/constants'
import { Command } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'
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
      inputs: mergeIfUnique(manifest.inputs),
      abis: mergeIfUnique(manifest.abis),
      metadata: { runnerTarget: RUNNER_TARGET_VERSION },
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
