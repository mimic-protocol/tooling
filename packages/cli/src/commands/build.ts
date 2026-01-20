import { Command, Flags } from '@oclif/core'

import Codegen from './codegen'
import Compile from './compile'

export default class Build extends Command {
  static override description = 'Runs code generation and then compiles the function'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --function src/function.ts --output ./build --types ./src/types',
  ]

  static override flags = {
    manifest: Flags.string({ char: 'm', description: 'manifest to use', default: 'manifest.yaml' }),
    // TODO TEST THIS
    function: Flags.string({ char: 'f', description: 'function to compile', default: 'src/function.ts' }),
    output: Flags.string({ char: 'o', description: 'output directory for build artifacts', default: './build' }),
    types: Flags.string({ char: 'y', description: 'output directory for generated types', default: './src/types' }),
    clean: Flags.boolean({
      char: 'c',
      description: 'remove existing generated types before generating new files',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build)
    const { manifest, function: functionFile, output, types, clean } = flags

    const codegenArgs: string[] = ['--manifest', manifest, '--output', types]
    if (clean) codegenArgs.push('--clean')

    await Codegen.run(codegenArgs)

    const compileArgs: string[] = ['--function', functionFile, '--manifest', manifest, '--output', output]
    await Compile.run(compileArgs)
  }
}
