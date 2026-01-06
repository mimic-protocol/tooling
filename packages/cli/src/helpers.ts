import { Command, Flags } from '@oclif/core'
import { Interface } from 'ethers'
import camelCase from 'lodash/camelCase'
import startCase from 'lodash/startCase'

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
    description: 'When mimic.yaml exists, only run tasks with these names (space-separated)',
    multiple: true,
    exclusive: ['exclude'],
  }),
  exclude: Flags.string({
    description: 'When mimic.yaml exists, exclude tasks with these names (space-separated)',
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

  if (include) {
    const invalidNames = include.filter((name) => !taskNames.has(name))
    if (invalidNames.length > 0) {
      console.warn(`${log.warnText('Warning:')} The following task names were not found: ${invalidNames.join(', ')}`)
    }

    const validNames = new Set(include.filter((name) => taskNames.has(name)))
    if (validNames.size === 0) {
      console.warn(`${log.warnText('Warning:')} No valid tasks to include. All tasks will be skipped.`)
      return []
    }

    return tasks.filter((task) => validNames.has(task.name))
  }

  if (exclude) {
    const invalidNames = exclude.filter((name) => !taskNames.has(name))
    if (invalidNames.length > 0) {
      console.warn(`${log.warnText('Warning:')} The following task names were not found: ${invalidNames.join(', ')}`)
    }

    const excludeSet = new Set(exclude)
    const filteredTasks = tasks.filter((task) => !excludeSet.has(task.name))
    if (filteredTasks.length === 0) {
      console.warn(`${log.warnText('Warning:')} All tasks are excluded.`)
    }
    return filteredTasks
  }

  return tasks
}
