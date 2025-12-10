import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import simpleGit from 'simple-git'

import { execBinCommand, installDependencies } from '../lib/packageManager'
import log from '../log'

export default class Init extends Command {
  static override description = 'Initializes a new Mimic-compatible project structure in the specified directory'

  static override examples = ['<%= config.bin %> <%= command.id %> --directory ./new-project --force']

  static override flags = {
    directory: Flags.string({ char: 'd', description: 'Directory to initialize project', default: './' }),
    force: Flags.boolean({ char: 'f', description: 'Overwrite existing files if they already exist', default: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init)
    const { directory, force } = flags
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
      for (const file of fs.readdirSync(fullDirectory)) {
        fs.rmSync(path.join(fullDirectory, file), { recursive: true, force: true })
      }
    }

    log.startAction('Creating files')

    if (fs.existsSync(fullDirectory) && fs.readdirSync(fullDirectory).length > 0) {
      this.error(`Directory ${log.highlightText(fullDirectory)} is not empty`, {
        code: 'DirectoryNotEmpty',
        suggestions: [
          'You can specify the directory with --directory',
          `You can ${log.warnText('overwrite')} an existing directory with --force`,
        ],
      })
    }

    if (!fs.existsSync(fullDirectory)) {
      fs.mkdirSync(fullDirectory, { recursive: true })
    }

    // Clone to a temp directory and copy files to preserve the original directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mimic-init-'))
    try {
      await simpleGit().clone('https://github.com/mimic-protocol/init-template.git', tempDir)

      // Remove .git from temp to make it a fresh project
      const gitDir = path.join(tempDir, '.git')
      if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true })

      // Copy all files from temp to destination
      fs.cpSync(tempDir, fullDirectory, { recursive: true })
    } catch (error) {
      this.error(`Failed to clone template repository. Details: ${error}`)
    } finally {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true })
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
