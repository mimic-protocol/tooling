import { Command } from '@oclif/core'

import { FlagsType } from '../types'

import Codegen from './codegen'
import Compile from './compile'
import Functions, { FunctionConfig } from './functions'
import path from 'path/win32'
import log from '../log'

export type BuildFlags = FlagsType<typeof Build>

export default class Build extends Command {
  static override description = 'Runs code generation and then compiles the function'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --function src/function.ts --build-directory ./build --types-directory ./src/types',
  ]

  static override flags = {
    ...Functions.flags,
    ...Codegen.flags,
    ...Compile.flags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build)
    await Build.buildFunctions(this, Functions.filterFunctions(this, flags), flags)
  }

  public static async buildFunctions(cmd: Command, functions: FunctionConfig[], flags: BuildFlags): Promise<void> {
    for (const func of functions) {
      log.startAction(`Starting building for function ${func.name}`)
      await Build.build(cmd, {
        ...flags,
        function: func.function,
        'build-directory': path.join(flags['build-directory'], func.name),
        manifest: func.manifest,
      })
    }
  }

  public static async build(cmd: Command, flags: BuildFlags): Promise<void> {
    await Codegen.codegen(cmd, flags)
    await Compile.compile(cmd, flags)
  }
}
