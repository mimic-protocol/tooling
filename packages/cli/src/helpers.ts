import { confirm } from '@inquirer/prompts'
import { Command } from '@oclif/core'
import { Interface } from 'ethers'
import camelCase from 'lodash/camelCase'
import startCase from 'lodash/startCase'

import { Logger } from './core/types'
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

function convertToCommandError(error: unknown): Error {
  if (error instanceof CoreError) {
    return new CommandError(error.message, {
      code: error.code,
      suggestions: error.suggestions,
    })
  }
  return error as Error
}

function logTaskError(taskName: string, err: Error): void {
  console.error(log.warnText(`Task "${taskName}" failed: ${err.message}`))

  if (err instanceof CommandError) {
    if (err.code) {
      console.error(`  Code: ${err.code}`)
    }
    if (err.suggestions?.length) {
      console.error(`  Suggestions:`)
      err.suggestions.forEach((suggestion) => console.error(`    - ${suggestion}`))
    }
  }
}

export async function runTasks<T>(
  command: Command,
  configs: RequiredTaskConfig[],
  runTask: (config: RequiredTaskConfig) => Promise<T>
): Promise<void> {
  const errors: Array<{ task: string; error: Error; code?: string; suggestions?: string[] }> = []

  const shouldLogHeader = configs.length > 1 || configs[0].name !== DEFAULT_TASK_NAME
  const isSingleTask = configs.length === 1

  for (const config of configs) {
    if (shouldLogHeader) {
      console.log(`\n${log.highlightText(`[${config.name}]`)}`)
    }
    try {
      await runTask(config)
    } catch (error) {
      const err = convertToCommandError(error)

      if (isSingleTask) throw err

      logTaskError(config.name, err)

      if (err instanceof CommandError) {
        errors.push({ task: config.name, error: err, code: err.code, suggestions: err.suggestions })
      } else {
        errors.push({ task: config.name, error: err })
      }
    }
  }

  if (errors.length > 0) {
    console.log(`\n${log.warnText('Summary:')} ${errors.length}/${configs.length} task(s) failed`)
    errors.forEach(({ task, code }) => {
      console.log(code ? `  - ${task} (${code})` : `  - ${task}`)
    })
    command.exit(1)
  }
}

export function createConfirmClean(directory: string, logger: Logger): () => Promise<boolean> {
  return async function confirmClean(): Promise<boolean> {
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
