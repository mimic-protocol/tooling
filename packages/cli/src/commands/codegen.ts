import { Command, Flags } from '@oclif/core'

import { codegen } from '../core'
import { createConfirmClean, runTasks } from '../helpers'
import MimicConfigHandler, { taskFilterFlags } from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'

export default class Codegen extends Command {
  static override description = 'Generates typed interfaces for declared inputs and ABIs from your manifest.yaml file'

  static override examples = ['<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --output ./types']

  static override flags = {
    manifest: Flags.string({ char: 'm', description: 'Specify a custom manifest file path', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'Output directory for generated types', default: './src/types' }),
    clean: Flags.boolean({
      char: 'c',
      description: 'Remove existing generated types before generating new files',
      default: false,
    }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Codegen)
    const { manifest, output, clean, include, exclude } = flags

    const tasks = MimicConfigHandler.getFilteredTasks(this, {
      defaultTask: {
        manifest,
        types: output,
        task: '',
        output: '',
      },
      include,
      exclude,
    })
    await runTasks(this, tasks, async (config) => {
      await codegen(
        {
          manifestPath: config.manifest,
          outputDir: config.types,
          clean,
          confirmClean: createConfirmClean(this, config.types, coreLogger),
        },
        coreLogger
      )
    })
  }
}
