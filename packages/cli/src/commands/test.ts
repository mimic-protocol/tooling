import { Command, Flags } from '@oclif/core'
import * as path from 'path'

import { execBinCommand } from '../lib/packageManager'
import { FlagsType } from '../types'

import Build from './build'
import Functions from './functions'

export type TestFlags = FlagsType<typeof Test>

export default class Test extends Command {
  static override description = 'Runs function tests'

  static override examples = ['<%= config.bin %> <%= command.id %> --directory ./tests']

  static override flags = {
    ...{
      ...Functions.flags,
      include: {
        ...Functions.flags.include,
        description: Functions.flags.include.description + '. Only for building, it does not affect testing',
      },
      exclude: {
        ...Functions.flags.exclude,
        description: Functions.flags.exclude.description + '. Only for building, it does not affect testing',
      },
    },
    ...Build.flags,
    directory: Flags.string({ char: 'd', description: 'Path to the testing directory', default: './tests' }),
    'skip-build': Flags.boolean({ description: 'Skip build before testing', default: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Test)
    await Test.test(this, flags)
  }

  public static async test(cmd: Command, flags: TestFlags): Promise<void> {
    const { directory, 'skip-build': skipBuild } = flags
    const baseDir = path.resolve('./')
    const testPath = path.join(baseDir, directory)

    if (!skipBuild) await Functions.runFunctions(cmd, flags, Build.build, 'building')

    const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', `${testPath}/**/*.spec.ts`], baseDir)
    cmd.exit(result.status ?? 1)
  }
}
