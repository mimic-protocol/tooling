import { Command, Flags } from '@oclif/core'

import { build } from '../core'
import { createConfirmClean, filterTasks, handleCoreError, runTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'
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

    const allTasks = MimicConfigHandler.loadOrDefault(this, {
      manifest,
      path: task,
      output,
      types,
    })
    const tasks = filterTasks(this, allTasks, include, exclude)
    await runTasks(this, tasks, (taskConfig) => this.runForTask(taskConfig, clean))
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name'>, clean: boolean): Promise<void> {
    try {
      const result = await build(
        {
          manifestPath: task.manifest,
          taskPath: task.path,
          outputDir: task.output,
          typesDir: task.types,
          clean,
          confirmClean: createConfirmClean(task.types, coreLogger),
        },
        coreLogger
      )

      if (clean && !result.success) this.exit(0)

      coreLogger.info(`Build complete! Artifacts in ${task.output}/`)
    } catch (error) {
      handleCoreError(error)
    }
  }
}
