import { Command, Flags } from '@oclif/core'

import { compile } from '../core'
import { filterTasks, runTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'

export default class Compile extends Command {
  static override description = 'Compiles task'

  static override examples = ['<%= config.bin %> <%= command.id %> --task src/task.ts --output ./output']

  static override flags = {
    task: Flags.string({ char: 't', description: 'task to compile', default: 'src/task.ts' }),
    manifest: Flags.string({ char: 'm', description: 'manifest to validate', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'output directory', default: './build' }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    const { task: taskPath, output, manifest, include, exclude } = flags

    const allTasks = MimicConfigHandler.loadOrDefault(this, {
      manifest,
      task: taskPath,
      output,
      types: '',
    })
    const tasks = filterTasks(this, allTasks, include, exclude)
    await runTasks(this, tasks, async (task) => {
      await compile(
        {
          manifestPath: task.manifest,
          taskPath: task.task,
          outputDir: task.output,
        },
        coreLogger
      )

      coreLogger.info(`Build complete! Artifacts in ${task.output}/`)
    })
  }
}
