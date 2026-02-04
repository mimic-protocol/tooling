import { Command, Flags } from '@oclif/core'
import * as path from 'path'

import { execBinCommand } from '../lib/packageManager'
import { FlagsType } from '../types'

import Build from './build'

export type TestFlags = FlagsType<typeof Test>

export default class Test extends Command {
  static override description = 'Runs function tests'

  static override examples = ['<%= config.bin %> <%= command.id %> --directory ./']

  static override flags = {
    ...Build.flags,
    directory: Flags.string({ char: 'd', description: 'Testing directory', default: './test' }),
    'skip-build': Flags.boolean({ description: 'Skip codegen and compile steps before uploading', default: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Test)
    await this.test(this, flags)
  }

  public async test(cmd: Command, flags: TestFlags): Promise<void> {
    const { directory, 'skip-build': skipBuild } = flags

    if (!skipBuild) {
      await Build.build(this, flags)
    }

    const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', `${directory}/**/*.spec.ts`], './')
    this.exit(result.status ?? 1)
  }
}
