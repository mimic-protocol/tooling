import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import { Interface } from 'ethers'
import camelCase from 'lodash/camelCase'
import startCase from 'lodash/startCase'

import { Logger } from './core/types'
import { MIMIC_CONFIG_FILE } from './lib/MimicConfigHandler'
import { DEFAULT_TASK_NAME } from './constants'
import { CoreError } from './core'
import { CommandError } from './errors'
import log from './log'
import { AbiFunctionItem, RequiredTaskConfig } from './types'

export function getFunctionSelector(fn: AbiFunctionItem): string {
  const iface = new Interface([fn])
  return iface.getFunction(fn.name)!.selector
}

export function pascalCase(str: string): string {
  return startCase(camelCase(str)).replace(/\s/g, '')
}

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

export function filterTasks(
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

  if (!include && !exclude) return tasks

  const taskNames = new Set(tasks.map((task) => task.name))

  const warnInvalidTaskNames = (names: string[]): void => {
    if (names.length > 0) {
      console.warn(`${log.warnText('Warning:')} The following task names were not found: ${names.join(', ')}`)
    }
  }

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

export async function runTasks<T>(
  command: Command,
  tasks: RequiredTaskConfig[],
  runTask: (task: RequiredTaskConfig) => Promise<T>
): Promise<void> {
  const errors: Array<{ task: string; error: Error; code?: string; suggestions?: string[] }> = []

  const shouldLogHeader = tasks.length > 1 || tasks[0].name !== DEFAULT_TASK_NAME
  const isSingleTask = tasks.length === 1

  for (const task of tasks) {
    if (shouldLogHeader) {
      console.log(`\n${log.highlightText(`[${task.name}]`)}`)
    }
    try {
      await runTask(task)
    } catch (error) {
      if (isSingleTask) throw error

      const err = error as Error
      console.error(log.warnText(`Task "${task.name}" failed: ${err.message}`))

      if (err instanceof CommandError) {
        if (err.code) console.error(`  Code: ${err.code}`)
        if (err.suggestions?.length) {
          console.error(`  Suggestions:`)
          err.suggestions.forEach((s) => console.error(`    - ${s}`))
        }
        errors.push({ task: task.name, error: err, code: err.code, suggestions: err.suggestions })
      } else {
        errors.push({ task: task.name, error: err })
      }
    }
  }

  if (errors.length > 0) {
    console.log(`\n${log.warnText('Summary:')} ${errors.length}/${tasks.length} task(s) failed`)
    errors.forEach(({ task, code }) => {
      console.log(code ? `  - ${task} (${code})` : `  - ${task}`)
    })
    command.exit(1)
  }
}

export function handleCoreError(command: Command, error: unknown): void {
  if (error instanceof CoreError) {
    throw new CommandError(error.message, {
      code: error.code,
      suggestions: error.suggestions,
    })
  }
  throw error
}

export function createConfirmClean(directory: string, logger: Logger): () => Promise<boolean> {
  return async () => {
    const shouldDelete = await confirm({
      message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(
        directory
      )}. This action is ${log.warnText('irreversible')}`,
      default: false,
    })
    if (!shouldDelete) {
      logger.info('You can remove the --clean flag from your command')
      logger.info('Stopping initialization...')
    }
    return shouldDelete
  }
}
