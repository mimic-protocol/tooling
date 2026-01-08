import { Command, Flags } from '@oclif/core'

import { filterTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import log from '../log'
import { RequiredTaskConfig } from '../types'

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
    'skip-config': Flags.boolean({
      hidden: true,
      description: 'Skip mimic.yaml config (used internally)',
      default: false,
    }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build)
    const { manifest, task, output, types, clean, include, exclude, 'skip-config': skipConfig } = flags

    if (!skipConfig && MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      for (const taskConfig of tasks) {
        console.log(`\n${log.highlightText(`[${taskConfig.name}]`)}`)
        await this.runForTask(taskConfig, clean)
      }
    } else {
      await this.runForTask({ manifest, entry: task, output, types }, clean)
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name'>, clean: boolean): Promise<void> {
    const codegenArgs: string[] = ['--manifest', task.manifest, '--output', task.types, '--skip-config']
    if (clean) codegenArgs.push('--clean')

    await Codegen.run(codegenArgs)

    const compileArgs: string[] = [
      '--task',
      task.entry,
      '--manifest',
      task.manifest,
      '--output',
      task.output,
      '--skip-config',
    ]
    await Compile.run(compileArgs)
  }
}
