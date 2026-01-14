import { Command, Flags } from '@oclif/core'

import { codegen } from '../core'
import { createConfirmClean, filterTasks, handleCoreError, runTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'
import { RequiredTaskConfig } from '../types'

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

    const allTasks = MimicConfigHandler.loadOrDefault(this, {
      manifest,
      types: output,
      path: '',
      output: '',
    })
    const tasks = filterTasks(this, allTasks, include, exclude)
    await runTasks(this, tasks, (task) => this.runForTask(task, clean))
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name'>, clean: boolean): Promise<void> {
    try {
      const result = await codegen(
        {
          manifestPath: task.manifest,
          outputDir: task.types,
          clean,
          confirmClean: createConfirmClean(task.types, coreLogger),
        },
        coreLogger
      )

      if (clean && !result.success) this.exit(0)
    } catch (error) {
      handleCoreError(error)
    }
  }
}
