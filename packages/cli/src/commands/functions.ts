import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'

import log from '../log'
import { FlagsType } from '../types'

export type FunctionsFlags = FlagsType<typeof Functions>

export const DefaultFunctionConfig = {
  name: '',
  manifest: 'manifest.yaml',
  function: 'src/function.ts',
  'build-directory': './build',
  'types-directory': './src/types',
} as const

export type FunctionConfig = {
  name: string
  manifest: string
  function: string
  'build-directory': string
  'types-directory': string
}

export default class Functions extends Command {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(): Promise<any> {
    throw new Error('Method not implemented.')
  }

  static override description = 'Filters tasks based on a mimic.yaml configuration file'

  static MIMIC_CONFIG_FILE = 'mimic.yaml'

  static flags = {
    'config-file': Flags.string({
      description: `Path to the ${Functions.MIMIC_CONFIG_FILE} file, this overrides other parameters like build-directory and function`,
      default: Functions.MIMIC_CONFIG_FILE,
    }),
    include: Flags.string({
      description: `When ${Functions.MIMIC_CONFIG_FILE} exists, only run tasks with these names (space-separated)`,
      multiple: true,
      exclusive: ['exclude'],
    }),
    exclude: Flags.string({
      description: `When ${Functions.MIMIC_CONFIG_FILE} exists, exclude tasks with these names (space-separated)`,
      multiple: true,
      exclusive: ['include'],
    }),
  }

  public static async runFunctions<T extends FunctionsFlags & Partial<FunctionConfig>>(
    cmd: Command,
    flags: T,
    cmdLogic: (cmd: Command, flags: T) => Promise<void>,
    cmdActions: string
  ): Promise<void> {
    const functions = Functions.filterFunctions(cmd, flags)
    for (const func of functions) {
      log.startAction(`Starting ${cmdActions} for function ${func.name}`)
      await cmdLogic(cmd, { ...flags, ...func } as T)
    }
  }

  public static filterFunctions(cmd: Command, flags: FunctionsFlags & Partial<FunctionConfig>): FunctionConfig[] {
    if (!fs.existsSync(flags['config-file'])) {
      // If doesn't exists return the default with the flags the user added
      return [{ ...DefaultFunctionConfig, ...flags }]
    }

    // Read and parse YAML file
    const fileContents = fs.readFileSync(flags['config-file'], 'utf8')
    const config = yaml.load(fileContents) as { tasks: FunctionConfig[] }

    // Get all tasks
    let tasks = config.tasks || []

    // Apply include filter if specified
    if (flags.include && flags.include.length > 0) {
      tasks = tasks.filter((task) => flags.include!.includes(task.name))
    }

    // Apply exclude filter if specified
    if (flags.exclude && flags.exclude.length > 0) {
      tasks = tasks.filter((task) => !flags.exclude!.includes(task.name))
    }

    return tasks
  }
}
