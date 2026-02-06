import { Command } from '@oclif/core'

import { FlagsType } from '../types'

import Codegen from './codegen'
import Compile from './compile'
import Functions from './functions'

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
    await Functions.runFunctions(this, flags, Build.build, 'build')
  }

  public static async build(cmd: Command, flags: BuildFlags): Promise<void> {
    await Codegen.codegen(cmd, flags)
    await Compile.compile(cmd, flags)
  }
}
