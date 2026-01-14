import { Command, Flags } from '@oclif/core'
import * as path from 'path'

import { DEFAULT_TASK } from '../constants'
import { buildForTest, getTestPath, runTests } from '../core'
import { runTasks } from '../helpers'
import MimicConfigHandler, { taskFilterFlags } from '../lib/MimicConfigHandler'
import { coreLogger } from '../log'

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

    const tasks = MimicConfigHandler.getFilteredTasks(this, {
      defaultTask: DEFAULT_TASK,
      include,
      exclude,
      baseDir,
    })

    if (!skipCompile) {
      await runTasks(this, tasks, async (config) => {
        const originalCwd = process.cwd()
        try {
          process.chdir(baseDir)
          await buildForTest(
            {
              manifestPath: config.manifest,
              taskPath: config.task,
              outputDir: config.output,
              typesDir: config.types,
              cwd: baseDir,
            },
            coreLogger
          )
        } finally {
          process.chdir(originalCwd)
        }
        testPaths.add(getTestPath(baseDir))
      })
    } else {
      testPaths.add(getTestPath(baseDir))
    }

    if (testPaths.size > 0) runTests({ testPaths: Array.from(testPaths), baseDir }, coreLogger)
  }
}
