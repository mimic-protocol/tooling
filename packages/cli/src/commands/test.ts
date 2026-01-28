import { Command, Flags } from '@oclif/core'
import * as path from 'path'

import { execBinCommand } from '../lib/packageManager'

export default class Test extends Command {
  static override description = 'Runs function tests'

  static override examples = ['<%= config.bin %> <%= command.id %> --directory ./']

  static override flags = {
    directory: Flags.string({ char: 'd', description: 'function directory', default: './' }),
    'skip-compile': Flags.boolean({ description: 'skip codegen and compile steps' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Test)
    const { directory, 'skip-compile': skipCompile } = flags
    const baseDir = path.resolve(directory)
    const testPath = path.join(baseDir, 'tests')

    if (!skipCompile) {
      const cg = execBinCommand('mimic', ['codegen'], baseDir)
      if (cg.status !== 0) this.exit(cg.status ?? 1)
      const cp = execBinCommand('mimic', ['compile'], baseDir)
      if (cp.status !== 0) this.exit(cp.status ?? 1)
    }

    const result = execBinCommand('tsx', ['./node_modules/mocha/bin/mocha.js', `${testPath}/**/*.spec.ts`], baseDir)
    this.exit(result.status ?? 1)
  }
}
