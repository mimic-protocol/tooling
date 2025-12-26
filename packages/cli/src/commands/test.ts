import { Args, Command, Flags } from '@oclif/core'
import * as path from 'path'

import { execBinCommand } from '../lib/packageManager'

export default class Test extends Command {
  static override description = 'Runs task tests'

  static override examples = ['<%= config.bin %> <%= command.id %> ./']

  static override args = {
    directory: Args.string({ description: 'task directory', required: false, default: './' }),
  }

  static override flags = {
    'skip-compile': Flags.boolean({ description: 'skip codegen and compile steps' }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Test)
    const { directory } = args
    const baseDir = path.resolve(directory)
    const testPath = path.join(baseDir, 'tests')

    if (!flags.skipCompile) {
      const cg = execBinCommand('mimic', ['codegen'], baseDir)
      if (cg.status !== 0) this.exit(cg.status ?? 1)
      const cp = execBinCommand('mimic', ['compile'], baseDir)
      if (cp.status !== 0) this.exit(cp.status ?? 1)
    }

    const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', `${testPath}/**/*.spec.ts`], baseDir)
    this.exit(result.status ?? 1)
  }
}
