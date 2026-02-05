import { confirm } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'
import simpleGit from 'simple-git'

import { execBinCommand, installDependencies } from '../lib/packageManager'
import log from '../log'
import { FlagsType } from '../types'

export type InitFlags = FlagsType<typeof Init> & { directory: string }

export default class Init extends Command {
  static override description = 'Initializes a new Mimic-compatible project structure in the specified directory'

  static override examples = ['<%= config.bin %> <%= command.id %> ./new-project --force']

  static override args = {
    directory: Args.string({ description: 'Directory to initialize project', required: false, default: './' }),
  }

  static override flags = {
    force: Flags.boolean({ char: 'f', description: 'Overwrite existing files if they already exist', default: false }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init)
    await Init.init(this, { ...flags, ...args })
  }

  public static async init(cmd: Command, flags: InitFlags): Promise<void> {
    const { directory, force } = flags
    const absDir = path.resolve(directory)

    if (force && fs.existsSync(absDir) && fs.readdirSync(absDir).length > 0) {
      const shouldDelete =
        process.env.NODE_ENV === 'test'
          ? true
          : await confirm({
              message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(absDir)}. This action is ${log.warnText('irreversible')}`,
              default: false,
            })
      if (!shouldDelete) {
        console.log('You can remove the --force flag from your command')
        console.log('Stopping initialization...')
        cmd.exit(0)
      }
      log.startAction(`Deleting contents of ${absDir}`)
      // Delete files individually instead of removing the entire directory to preserve
      // the directory reference. This prevents issues when the directory is the current
      // working directory, as removing it would cause the reference to be lost.
      for (const file of fs.readdirSync(absDir)) {
        fs.rmSync(path.join(absDir, file), { recursive: true, force: true })
      }
    }

    log.startAction('Creating files')

    if (fs.existsSync(absDir) && fs.readdirSync(absDir).length > 0) {
      cmd.error(`Directory ${log.highlightText(absDir)} is not empty`, {
        code: 'DirectoryNotEmpty',
        suggestions: [
          'You can specify the directory as a positional argument',
          `You can ${log.warnText('overwrite')} an existing directory with --force`,
        ],
      })
    }

    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true })
    }

    try {
      await simpleGit().clone('https://github.com/mimic-protocol/init-template.git', absDir)

      const gitDir = path.join(absDir, '.git')
      if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true })
    } catch (error) {
      cmd.error(`Failed to clone template repository. Details: ${error}`)
    }

    this.installDependencies(absDir)
    this.runCodegen(absDir)
    log.stopAction()
    console.log('New project initialized!')
  }

  private static installDependencies(absDir: string) {
    if (process.env.NODE_ENV === 'test') return
    installDependencies(absDir)
  }

  private static runCodegen(absDir: string) {
    if (process.env.NODE_ENV === 'test') return
    execBinCommand('mimic', ['codegen'], absDir)
  }
}
