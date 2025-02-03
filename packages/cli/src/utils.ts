import { Command } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'
import { ZodError } from 'zod'

import { DuplicateEntryError, EmptyManifestError, MoreThanOneEntryError } from './errors'
import { validateManifest } from './ManifestValidator'

export function loadManifest(command: Command, manifestDir: string) {
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
    return validateManifest(loadedManifest)
  } catch (err) {
    handleValidationError(command, err)
  }
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
    suggestions = err.errors.map((e) => `${e.path.join('/')}: ${e.message}`)
  } else {
    ;[message, code] = [`Unkown Error: ${err}`, 'UnknownError']
    suggestions = [
      'Contact the Mimic team for further assistance at our website https://www.mimic.fi/ or discord https://discord.com/invite/cpcyV9EsEg',
    ]
  }

  command.error(message, { code, suggestions })
}
