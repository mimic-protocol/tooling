import { Command } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'
import { ZodError } from 'zod'

import { GENERIC_SUGGESTION } from '../errors'
import { MimicConfig, RequiredTaskConfig } from '../types'
import { MimicConfigValidator } from '../validators'

export const MIMIC_CONFIG_FILE = 'mimic.yaml'

export default {
  exists(baseDir: string = process.cwd()): boolean {
    return fs.existsSync(path.join(baseDir, MIMIC_CONFIG_FILE))
  },

  load(command: Command, baseDir: string = process.cwd()): MimicConfig {
    const mimicConfigPath = path.join(baseDir, MIMIC_CONFIG_FILE)

    if (!fs.existsSync(mimicConfigPath)) {
      command.error(`Could not find ${mimicConfigPath}`, {
        code: 'FileNotFound',
        suggestions: [`Ensure ${MIMIC_CONFIG_FILE} exists in the project root`],
      })
    }

    let loadedMimicConfig
    try {
      loadedMimicConfig = load(fs.readFileSync(mimicConfigPath, 'utf-8'))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      command.error(`Failed to parse ${mimicConfigPath} as YAML`, {
        code: 'ParseError',
        suggestions: [`Ensure ${MIMIC_CONFIG_FILE} is valid YAML syntax`],
      })
    }

    try {
      return MimicConfigValidator.parse(loadedMimicConfig)
    } catch (err) {
      handleValidationError(command, err)
    }
  },

  getTasks(mimicConfig: MimicConfig): RequiredTaskConfig[] {
    return mimicConfig.tasks.map((task) => ({
      ...task,
      output: task.output ?? `build/${task.name}`,
      types: task.types ?? path.join(path.dirname(task.entry), 'types'),
    }))
  },
}

function handleValidationError(command: Command, err: unknown): never {
  let message: string
  let code: string
  let suggestions: string[]

  if (err instanceof ZodError) {
    ;[message, code] = ['Invalid mimic.yaml configuration', 'ValidationError']
    suggestions = err.errors.map((e) => `Fix Field "${e.path.join('.')}" -- ${e.message}`)
  } else {
    ;[message, code] = [`Unknown Error: ${err}`, 'UnknownError']
    suggestions = GENERIC_SUGGESTION
  }

  command.error(message, { code, suggestions })
}
