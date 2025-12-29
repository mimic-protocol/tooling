import { Args, Command, Flags } from '@oclif/core'
import * as path from 'path'

import { filterTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { RequiredTaskConfig } from '../types'

export default class Test extends Command {
  static override description = 'Runs task tests'

  static override examples = ['<%= config.bin %> <%= command.id %> ./']

  static override args = {
    directory: Args.string({ description: 'task directory', required: false, default: './' }),
  }

  static override flags = {
    'skip-compile': Flags.boolean({ description: 'skip codegen and compile steps' }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Test)
    const { directory } = args
    const { 'skip-compile': skipCompile, include, exclude } = flags
    const baseDir = path.resolve(directory)

    if (MimicConfigHandler.exists(baseDir)) {
      const mimicConfig = MimicConfigHandler.load(this, baseDir)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      for (const task of tasks) {
        console.log(`\n${log.highlightText(`[${task.name}]`)}`)
        this.runForTask(task, baseDir, skipCompile)
      }
    } else {
      this.runForTask(
        { manifest: 'manifest.yaml', entry: 'src/task.ts', types: './src/types', output: './build' },
        baseDir,
        skipCompile
      )
    }
  }

  private runForTask(task: Omit<RequiredTaskConfig, 'name'>, baseDir: string, skipCompile: boolean): void {
    const taskDir = path.dirname(task.entry)
    const testPath = path.join(baseDir, taskDir, '..', 'tests')

    if (!skipCompile) {
      const cg = execBinCommand('mimic', ['codegen', '--manifest', task.manifest, '--output', task.types], baseDir)
      if (cg.status !== 0) this.exit(cg.status ?? 1)
      const cp = execBinCommand(
        'mimic',
        ['compile', '--task', task.entry, '--manifest', task.manifest, '--output', task.output],
        baseDir
      )
      if (cp.status !== 0) this.exit(cp.status ?? 1)
    }

    const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', `${testPath}/**/*.spec.ts`], baseDir)
    if (result.status !== 0) this.exit(result.status ?? 1)
  }
}
