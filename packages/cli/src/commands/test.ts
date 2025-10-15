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

  private runOrExit(cmd: string, args: string[], cwd: string) {
    const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' })
    if (result.status !== 0) this.exit(result.status ?? 1)
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Test)
    const baseDir = path.resolve(flags.directory)
    const testPath = path.join(baseDir, 'tests')

    if (!flags.skipCompile) {
      this.runOrExit('yarn', ['mimic', 'codegen'], baseDir)
      this.runOrExit('yarn', ['mimic', 'compile'], baseDir)
    }

    const result = spawnSync('yarn', ['tsx', './node_modules/mocha/bin/mocha.js', `${testPath}/**/*.spec.ts`], {
      cwd: baseDir,
      stdio: 'inherit',
    })
    this.exit(result.status ?? 1)
  }
}
