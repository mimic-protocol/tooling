import { confirm } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'
import simpleGit from 'simple-git'

import { execBinCommand, installDependencies } from '../lib/packageManager'
import log from '../log'

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
    const { directory } = args
    const { force } = flags
    const fullDirectory = path.resolve(directory)

    if (force && fs.existsSync(fullDirectory) && fs.readdirSync(fullDirectory).length > 0) {
      const shouldDelete =
        process.env.NODE_ENV === 'test'
          ? true
          : await confirm({
              message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(fullDirectory)}. This action is ${log.warnText('irreversible')}`,
              default: false,
            })
      if (!shouldDelete) {
        console.log('You can remove the --force flag from your command')
        console.log('Stopping initialization...')
        this.exit(0)
      }
      log.startAction(`Deleting contents of ${fullDirectory}`)
      // Delete files individually instead of removing the entire directory to preserve
      // the directory reference. This prevents issues when the directory is the current
      // working directory, as removing it would cause the reference to be lost.
      for (const file of fs.readdirSync(fullDirectory)) {
        fs.rmSync(path.join(fullDirectory, file), { recursive: true, force: true })
      }
    }

    log.startAction('Creating files')

    if (fs.existsSync(fullDirectory) && fs.readdirSync(fullDirectory).length > 0) {
      this.error(`Directory ${log.highlightText(fullDirectory)} is not empty`, {
        code: 'DirectoryNotEmpty',
        suggestions: [
          'You can specify the directory as a positional argument',
          `You can ${log.warnText('overwrite')} an existing directory with --force`,
        ],
      })
    }

    if (!fs.existsSync(fullDirectory)) {
      fs.mkdirSync(fullDirectory, { recursive: true })
    }

    try {
      await simpleGit().clone('https://github.com/mimic-protocol/init-template.git', fullDirectory)

      const gitDir = path.join(fullDirectory, '.git')
      if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true })
    } catch (error) {
      this.error(`Failed to clone template repository. Details: ${error}`)
    }

    this.installDependencies(fullDirectory)
    this.runCodegen(fullDirectory)
    log.stopAction()
    console.log('New project initialized!')
  }

  installDependencies(fullDirectory: string) {
    if (process.env.NODE_ENV === 'test') return
    installDependencies(fullDirectory)
  }

  runCodegen(fullDirectory: string) {
    if (process.env.NODE_ENV === 'test') return
    execBinCommand('mimic', ['codegen'], fullDirectory)
  }
}
