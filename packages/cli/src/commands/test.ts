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

    const testPaths = new Set<string>()

    if (MimicConfigHandler.exists(baseDir)) {
      const mimicConfig = MimicConfigHandler.load(this, baseDir)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)

      for (const task of tasks) {
        if (!skipCompile) {
          console.log(`\n${log.highlightText(`[${task.name}]`)}`)
          await this.compileTask(task, baseDir)
        }
        testPaths.add(this.getTestPath(baseDir))
      }
    } else {
      const defaultTask = {
        manifest: 'manifest.yaml',
        entry: 'src/task.ts',
        types: './src/types',
        output: './build',
      }
      if (!skipCompile) await this.compileTask(defaultTask, baseDir)
      testPaths.add(this.getTestPath(baseDir))
    }

    if (testPaths.size > 0) this.runTests(Array.from(testPaths), baseDir)
  }

  private async compileTask(task: Omit<RequiredTaskConfig, 'name'>, baseDir: string): Promise<void> {
    const cg = execBinCommand(
      'mimic',
      ['codegen', '--manifest', task.manifest, '--output', task.types, '--skip-config'],
      baseDir
    )
    if (cg.status !== 0) this.exit(cg.status ?? 1)
    const cp = execBinCommand(
      'mimic',
      ['compile', '--task', task.entry, '--manifest', task.manifest, '--output', task.output, '--skip-config'],
      baseDir
    )
    if (cp.status !== 0) this.exit(cp.status ?? 1)
  }

  private getTestPath(baseDir: string): string {
    return path.join(baseDir, 'tests', '**', '*.spec.ts')
  }

  private runTests(testPaths: string[], baseDir: string): void {
    const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', ...testPaths], baseDir)
    if (result.status !== 0) this.exit(result.status ?? 1)
  }
}
