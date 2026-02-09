import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { z } from 'zod'

import log from '../log'
import { FlagsType } from '../types'

export type FunctionsFlags = FlagsType<typeof Functions>

export const FunctionConfigSchema = z.object({
  name: z.string().min(1, 'Function name is required'),
  manifest: z.string().min(1, 'Manifest path is required'),
  function: z.string().min(1, 'Function path is required'),
  'build-directory': z.string().min(1, 'Build directory is required'),
  'types-directory': z.string().min(1, 'Types directory is required'),
})

export type FunctionConfig = z.infer<typeof FunctionConfigSchema>

export const MimicConfigSchema = z.object({
  functions: z.array(FunctionConfigSchema).min(1, 'At least one function is required'),
})

export const DefaultFunctionConfig = {
  name: '',
  manifest: 'manifest.yaml',
  function: 'src/function.ts',
  'build-directory': './build',
  'types-directory': './src/types',
} as const

const MIMIC_CONFIG_FILE = 'mimic.yaml'

export default class Functions extends Command {
  run(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  static override hidden = true

  static flags = {
    'config-file': Flags.string({
      description: `Path to the ${MIMIC_CONFIG_FILE} file, this overrides other parameters like build-directory and function`,
      default: MIMIC_CONFIG_FILE,
    }),
    'no-config': Flags.boolean({
      description: `Do not read ${MIMIC_CONFIG_FILE}; use defaults and explicit flags instead`,
      default: false,
    }),
    include: Flags.string({
      description: `When ${MIMIC_CONFIG_FILE} exists, only run tasks with these names (space-separated)`,
      multiple: true,
      exclusive: ['exclude'],
      char: 'i',
    }),
    exclude: Flags.string({
      description: `When ${MIMIC_CONFIG_FILE} exists, exclude tasks with these names (space-separated)`,
      multiple: true,
      exclusive: ['include'],
      char: 'e',
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
      log.startAction(`\nStarting ${cmdActions} for function ${func.name ? func.name : func.function}`)
      await cmdLogic(cmd, { ...flags, ...func } as T)
    }
  }

  public static filterFunctions(cmd: Command, flags: FunctionsFlags & Partial<FunctionConfig>): FunctionConfig[] {
    if (flags['no-config']) {
      return [{ ...DefaultFunctionConfig, ...flags }]
    }

    if (!fs.existsSync(flags['config-file'])) {
      if (flags['config-file'] !== MIMIC_CONFIG_FILE) {
        cmd.error(`Could not find ${flags['config-file']}`, { code: 'ConfigNotFound' })
      }

      // If doesn't exist return the default with the flags the user added
      return [{ ...DefaultFunctionConfig, ...flags }]
    }

    const fileContents = fs.readFileSync(flags['config-file'], 'utf8')
    const rawConfig = yaml.load(fileContents)

    if (!rawConfig || (typeof rawConfig === 'object' && Object.keys(rawConfig).length === 0)) {
      cmd.error(`Invalid ${MIMIC_CONFIG_FILE} configuration: file is empty.`)
    }

    try {
      let { functions } = MimicConfigSchema.parse(rawConfig)

      if (flags.include && flags.include.length > 0) {
        Functions.checkMissingFunctions(cmd, functions, flags.include)
        functions = functions.filter((fn) => flags.include!.includes(fn.name))
      }

      if (flags.exclude && flags.exclude.length > 0) {
        Functions.checkMissingFunctions(cmd, functions, flags.exclude)
        functions = functions.filter((fn) => !flags.exclude!.includes(fn.name))
      }

      return functions
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')
        cmd.error(`Invalid ${MIMIC_CONFIG_FILE} configuration:\n${errors}`, { code: 'InvalidConfig' })
      }
      throw error
    }
  }

  private static checkMissingFunctions(
    cmd: Command,
    functions: FunctionConfig[],
    filteredFunctionNames: string[]
  ): void {
    const functionNames = new Set(functions.map((fn) => fn.name))
    const missingFunctions = filteredFunctionNames.filter((name) => !functionNames.has(name))
    if (missingFunctions.length > 0) {
      cmd.warn(`Functions not found in ${MIMIC_CONFIG_FILE}: ${missingFunctions.join(', ')}`)
    }
  }
}
