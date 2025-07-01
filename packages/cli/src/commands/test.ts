import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as path from 'path'

export default class Test extends Command {
  static override description = 'Runs task tests'

  static override examples = ['<%= config.bin %> <%= command.id %> --directory ./']

  static override flags = {
    directory: Flags.string({ char: 'd', description: 'task directory', default: './' }),
    skipCompile: Flags.boolean({ description: 'skip codegen and compile steps' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Test)
    const baseDir = path.resolve(flags.directory)
    const testPath = path.join(baseDir, 'tests')

    if (!flags.skipCompile) {
      // TODO: this only works if the task and the manifest are in the default paths
      const codegen = spawnSync('yarn', ['mimic', 'codegen'], { cwd: baseDir, stdio: 'inherit' })
      if (codegen.status !== 0) return

      const compile = spawnSync('yarn', ['mimic', 'compile'], { cwd: baseDir, stdio: 'inherit' })
      if (compile.status !== 0) return
    }
    spawnSync('yarn', ['tsx', './node_modules/mocha/bin/mocha.js', `${testPath}/**/*.spec.ts`], {
      stdio: 'inherit',
    })
  }
}
