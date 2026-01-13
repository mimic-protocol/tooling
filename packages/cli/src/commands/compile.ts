import { Command, Flags } from '@oclif/core'

import { compile } from '../core'
import { filterTasks, handleCoreError, runTasks, taskFilterFlags, toTaskConfig } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'
import { RequiredTaskConfig } from '../types'

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

    if (MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      await runTasks(this, tasks, (task) => this.runForTask(task))
    } else {
      await this.runForTask({ manifest, path: taskPath, output, types: '' })
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name'>): Promise<void> {
    const taskConfig = toTaskConfig(task)

    try {
      await compile(
        {
          manifestPath: taskConfig.manifestPath,
          taskPath: taskConfig.taskPath,
          outputDir: taskConfig.outputDir,
        },
        coreLogger
      )

      coreLogger.info(`Build complete! Artifacts in ${task.output}/`)
    } catch (error) {
      handleCoreError(this, error)
    }
  }
}
