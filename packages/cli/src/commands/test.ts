import { Command, Flags } from '@oclif/core'
import * as path from 'path'

import { DEFAULT_TASK } from '../constants'
import { buildForTest, getTestPath, runTests, TestError } from '../core'
import { filterTasks, handleCoreError, runTasks, taskFilterFlags } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'
import { RequiredTaskConfig } from '../types'

export default class Test extends Command {
  static override description = 'Runs task tests'

  static override examples = ['<%= config.bin %> <%= command.id %> --directory ./']

  static override flags = {
    directory: Flags.string({ char: 'd', description: 'task directory', default: './' }),
    'skip-compile': Flags.boolean({ description: 'skip codegen and compile steps' }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Test)
    const { directory, 'skip-compile': skipCompile, include, exclude } = flags
    const baseDir = path.resolve(directory)

    const testPaths = new Set<string>()

    try {
      const allTasks = MimicConfigHandler.loadOrDefault(this, DEFAULT_TASK, baseDir)
      const tasks = filterTasks(this, allTasks, include, exclude)

      if (!skipCompile) {
        await runTasks(this, tasks, async (task) => {
          await this.compileTask(task, baseDir)
          testPaths.add(getTestPath(baseDir))
        })
      } else {
        testPaths.add(getTestPath(baseDir))
      }

      if (testPaths.size > 0) runTests({ testPaths: Array.from(testPaths), baseDir }, coreLogger)
    } catch (error) {
      if (error instanceof TestError) this.exit(error.exitCode)

      handleCoreError(error)
    }
  }

  private async compileTask(task: Omit<RequiredTaskConfig, 'name'>, baseDir: string): Promise<void> {
    // Change to baseDir for compilation
    const originalCwd = process.cwd()
    try {
      process.chdir(baseDir)

      await buildForTest(
        {
          manifestPath: task.manifest,
          taskPath: task.task,
          outputDir: task.output,
          typesDir: task.types,
          cwd: baseDir,
        },
        coreLogger
      )
    } finally {
      process.chdir(originalCwd)
    }
  }
}
