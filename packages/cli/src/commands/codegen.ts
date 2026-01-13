import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'

import { codegen } from '../core'
import { filterTasks, handleCoreError, runTasks, taskFilterFlags, toTaskConfig } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import log, { coreLogger } from '../log'
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

    if (MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      await runTasks(this, tasks, (task) => this.runForTask(task, clean))
    } else {
      await this.runForTask({ manifest, types: output, path: '', output: '' }, clean)
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name'>, clean: boolean): Promise<void> {
    const taskConfig = toTaskConfig(task)

    try {
      const result = await codegen(
        {
          manifestPath: taskConfig.manifestPath,
          outputDir: taskConfig.typesDir,
          clean,
          confirmClean: async () => {
            const shouldDelete = await confirm({
              message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(taskConfig.typesDir)}. This action is ${log.warnText('irreversible')}`,
              default: false,
            })
            if (!shouldDelete) {
              console.log('You can remove the --clean flag from your command')
              console.log('Stopping initialization...')
            }
            return shouldDelete
          },
        },
        coreLogger
      )

      if (clean && !result.success) this.exit(0)
    } catch (error) {
      handleCoreError(this, error)
    }
  }
}
