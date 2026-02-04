import { Command, Flags } from '@oclif/core'

import { FlagsType } from '../types'

import Codegen from './codegen'
import Compile from './compile'

export type BuildFlags = FlagsType<typeof Build>

export default class Build extends Command {
  static override description = 'Runs code generation and then compiles the function'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --function src/function.ts --output ./build --types ./src/types',
  ]

  static override flags = {
    ...Codegen.flags,
    types: Flags.string({
      char: 't',
      description: Codegen.flags.output.description,
      default: Codegen.flags.output.default,
    }),
    ...Compile.flags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build)

    await Build.build(this, flags)
  }

  public static async build(cmd: Command, flags: BuildFlags): Promise<void> {
    await Codegen.codegen(cmd, { ...flags, output: flags.types })
    await Compile.compile(cmd, { ...flags })
  }
}
