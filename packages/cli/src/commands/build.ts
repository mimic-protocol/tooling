import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'

import { build } from '../core'
import { filterTasks, handleCoreError, runTasks, taskFilterFlags, toTaskConfig } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import log, { coreLogger } from '../log'
import { RequiredTaskConfig } from '../types'

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
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build)
    const { manifest, task, output, types, clean, include, exclude } = flags

    if (MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      await runTasks(this, tasks, (taskConfig) => this.runForTask(taskConfig, clean))
    } else {
      await this.runForTask({ manifest, path: task, output, types }, clean)
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name'>, clean: boolean): Promise<void> {
    const taskConfig = toTaskConfig(task)

    try {
      const result = await build(
        {
          manifestPath: taskConfig.manifestPath,
          taskPath: taskConfig.taskPath,
          outputDir: taskConfig.outputDir,
          typesDir: taskConfig.typesDir,
          clean,
          confirmClean: async () => {
            const shouldDelete = await confirm({
              message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(taskConfig.typesDir)}. This action is ${log.warnText('irreversible')}`,
              default: false,
            })
            if (!shouldDelete) {
              coreLogger.info('You can remove the --clean flag from your command')
              coreLogger.info('Stopping initialization...')
            }
            return shouldDelete
          },
        },
        coreLogger
      )

      if (clean && !result.success) this.exit(0)

      coreLogger.info(`Build complete! Artifacts in ${task.output}/`)
    } catch (error) {
      handleCoreError(this, error)
    }
  }
}
