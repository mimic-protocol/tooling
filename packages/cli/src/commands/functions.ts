import { Command, Flags } from '@oclif/core'

import { FlagsType } from '../types'

export type FunctionsFlags = FlagsType<typeof Functions>

export type FunctionConfig = {
  name: string
  manifest: string
  function: string
  buildDirectory: string
}

export default class Functions extends Command {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(): Promise<any> {
    throw new Error('Method not implemented.')
  }

  static override description = 'Authenticate with Mimic by storing your API key locally'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --profile production --api-key YOUR_API_KEY',
  ]

  static MIMIC_CONFIG_FILE = 'mimic.yaml'

  static flags = {
    'config-file': Flags.string({
      char: 'f',
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

  public static filterFunctions(cmd: Command, flags: FunctionsFlags): FunctionConfig[] {
    return [
      {
        name: 'Pepe',
        manifest: 'pepito.yaml',
        function: 'src/pepe.ts',
        buildDirectory: 'build/pepe',
      },
    ]
  }
}
