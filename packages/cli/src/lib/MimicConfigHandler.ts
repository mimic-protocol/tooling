import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'
import { ZodError } from 'zod'

import { DEFAULT_TASK_NAME } from '../constants'
import { GENERIC_SUGGESTION } from '../errors'
import log from '../log'
import { MimicConfig, RequiredTaskConfig } from '../types'
import { MimicConfigValidator } from '../validators'

const MIMIC_CONFIG_FILE = 'mimic.yaml'

export const taskFilterFlags = {
  include: Flags.string({
    description: `When ${MIMIC_CONFIG_FILE} exists, only run tasks with these names (space-separated)`,
    multiple: true,
    exclusive: ['exclude'],
  }),
  exclude: Flags.string({
    description: `When ${MIMIC_CONFIG_FILE} exists, exclude tasks with these names (space-separated)`,
    multiple: true,
    exclusive: ['include'],
  }),
}

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

  normalizeTaskConfigs(mimicConfig: MimicConfig): RequiredTaskConfig[] {
    return mimicConfig.tasks.map((task) => ({
      ...task,
      output: task.output ?? `build/${task.name}`,
      types: task.types ?? path.join(path.dirname(task.task), 'types'),
    }))
  },

  loadOrDefault(
    command: Command,
    defaultTask: Omit<RequiredTaskConfig, 'name'>,
    baseDir: string = process.cwd()
  ): RequiredTaskConfig[] {
    if (this.exists(baseDir)) {
      const mimicConfig = this.load(command, baseDir)
      return this.normalizeTaskConfigs(mimicConfig)
    }

    return [
      {
        ...defaultTask,
        name: DEFAULT_TASK_NAME,
      },
    ]
  },

  getFilteredTasks(
    command: Command,
    options: {
      defaultTask: Omit<RequiredTaskConfig, 'name'>
      include?: string[]
      exclude?: string[]
      baseDir?: string
    }
  ): RequiredTaskConfig[] {
    const allTasks = this.loadOrDefault(command, options.defaultTask, options.baseDir)
    return filterTasks(command, allTasks, options.include, options.exclude)
  },
}

function warnInvalidTaskNames(names: string[]): void {
  if (names.length > 0) {
    console.warn(`${log.warnText('Warning:')} The following task names were not found: ${names.join(', ')}`)
  }
}

function filterTasks(
  command: Command,
  tasks: RequiredTaskConfig[],
  include?: string[],
  exclude?: string[]
): RequiredTaskConfig[] {
  if (include && exclude) {
    command.error('Cannot use both --include and --exclude flags simultaneously', {
      code: 'ConflictingFlags',
      suggestions: ['Use either --include or --exclude, but not both'],
    })
  }

  if (!include && !exclude) {
    return tasks
  }

  const taskNames = new Set(tasks.map((task) => task.name))

  if (include) {
    const invalidNames = include.filter((name) => !taskNames.has(name))
    warnInvalidTaskNames(invalidNames)

    const validNames = new Set(include.filter((name) => taskNames.has(name)))
    if (validNames.size === 0) {
      console.warn(`${log.warnText('Warning:')} No valid tasks to include. All tasks will be skipped.`)
      return []
    }

    return tasks.filter((task) => validNames.has(task.name))
  }

  if (exclude) {
    const invalidNames = exclude.filter((name) => !taskNames.has(name))
    warnInvalidTaskNames(invalidNames)

    const excludeSet = new Set(exclude)
    const filteredTasks = tasks.filter((task) => !excludeSet.has(task.name))
    if (filteredTasks.length === 0) {
      console.warn(`${log.warnText('Warning:')} All tasks are excluded.`)
    }
    return filteredTasks
  }

  return tasks
}

function handleValidationError(command: Command, err: unknown): never {
  if (err instanceof ZodError) {
    const message = `Invalid ${MIMIC_CONFIG_FILE} configuration`
    const code = 'ValidationError'
    const suggestions = err.errors.map((e) => `Fix Field "${e.path.join('.')}" -- ${e.message}`)
    command.error(message, { code, suggestions })
  }

  const message = `Unknown Error: ${err}`
  const code = 'UnknownError'
  const suggestions = GENERIC_SUGGESTION
  command.error(message, { code, suggestions })
}
