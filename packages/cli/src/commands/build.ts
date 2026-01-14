import { Command, Flags } from '@oclif/core'

import { build } from '../core'
import { createConfirmClean, filterTasks, runTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'

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
      task: task,
      output,
      types,
    })
    const tasks = filterTasks(this, allTasks, include, exclude)
    await runTasks(this, tasks, async (taskConfig) => {
      const result = await build(
        {
          manifestPath: taskConfig.manifest,
          taskPath: taskConfig.task,
          outputDir: taskConfig.output,
          typesDir: taskConfig.types,
          clean,
          confirmClean: createConfirmClean(taskConfig.types, coreLogger),
        },
        coreLogger
      )

      if (clean && !result.success) this.exit(0)

      coreLogger.info(`Build complete! Artifacts in ${taskConfig.output}/`)
    })
  }
}
