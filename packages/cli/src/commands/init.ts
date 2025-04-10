import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

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
    const templateDirectory = path.join(__dirname, '../templates')

    if (force) {
      const shouldDelete = await confirm({
        message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(fullDirectory)}. This action is ${log.warnText('irreversible')}`,
        default: false,
      })
      if (!shouldDelete) {
        console.log('You can remove the --force flag from your command')
        console.log('Stopping initialization...')
        this.exit(0)
      }
      log.startAction(`Deleting contents of ${fullDirectory}`)
      if (fs.existsSync(fullDirectory)) fs.rmSync(fullDirectory, { recursive: true })
    }

    log.startAction('Creating files')

    if (fs.existsSync(fullDirectory)) {
      this.error(`Directory ${log.highlightText(fullDirectory)} is not empty`, {
        code: 'DirectoryNotEmpty',
        suggestions: [
          'You can specify the directory with --directory',
          `You can ${log.warnText('overwrite')} an existing directory with --force`,
        ],
      })
    }

    fs.mkdirSync(fullDirectory, { recursive: true })
    this.copyDirectory(templateDirectory, fullDirectory)

    // NOTE: This is a temporary solution to link the Mimic library, in the future, lib-ts should be a dependency
    log.startAction('Linking Mimic libraries')
    spawnSync('yarn', ['link', '@mimicprotocol/lib-ts'], {
      cwd: fullDirectory,
      stdio: 'inherit',
    })
    log.stopAction()

    log.startAction('Installing dependencies')
    spawnSync('yarn', ['install'], {
      cwd: fullDirectory,
      stdio: 'inherit',
    })
    log.stopAction()

    log.startAction('Initializing git repository')
    spawnSync('git', ['init'], {
      cwd: fullDirectory,
      stdio: 'inherit',
    })
    log.stopAction()

    console.log('New project initialized!')
  }

  private copyDirectory(source: string, destination: string): void {
    fs.mkdirSync(destination, { recursive: true })

    const entries = fs.readdirSync(source, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name)
      const destPath = path.join(destination, entry.name)

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
}
