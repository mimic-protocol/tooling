import { Command, Flags } from '@oclif/core'

import Codegen from './codegen'
import Compile from './compile'

export default class Build extends Command {
  static override description = 'Runs code generation and then compiles the task'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --task src/task.ts --output ./build --types ./src/types',
  ]

  static override flags = {
    manifest: Flags.string({ char: 'm', description: 'manifest to use', default: 'manifest.yaml' }),
    task: Flags.string({ char: 't', description: 'task to compile', default: 'src/task.ts' }),
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
    const { manifest, task, output, types, clean } = flags

    const codegenArgs: string[] = ['--manifest', manifest, '--output', types]
    if (clean) codegenArgs.push('--clean')

    await Codegen.run(codegenArgs)

    const compileArgs: string[] = ['--task', task, '--manifest', manifest, '--output', output]
    await Compile.run(compileArgs)
  }
}
