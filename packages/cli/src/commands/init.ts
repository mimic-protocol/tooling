import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import { highlightText, startAction, stopAction, warnText } from '../helpers'
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
        message: `Are you sure you want to ${warnText('delete')} all the contents in ${highlightText(fullDirectory)}. This action is ${warnText('irreversible')}`,
        default: false,
      })
      if (!shouldDelete) {
        console.log('You can remove the --force flag from your command')
        console.log('Stopping initialization...')
        this.exit(0)
      }
      startAction(`Deleting contents of ${fullDirectory}`)
      if (fs.existsSync(fullDirectory)) fs.rmSync(fullDirectory, { recursive: true })
      stopAction()
    }

    startAction('Creating files')

    if (fs.existsSync(fullDirectory)) {
      this.error(`Directory ${highlightText(fullDirectory)} is not empty`, {
        code: 'DirectoryNotEmpty',
        suggestions: [
          'You can specify the directory with --directory',
          `You can ${warnText('overwrite')} an existing directory with --force`,
        ],
      })
    }

    const srcPath = path.join(fullDirectory, 'src/')
    const manifestPath = path.join(fullDirectory, 'manifest.yaml')
    fs.mkdirSync(srcPath, { recursive: true })
    fs.copyFileSync(`${templateDirectory}/task.ts`, path.join(srcPath, 'task.ts'))
    fs.copyFileSync(`${templateDirectory}/manifest.yaml`, manifestPath)
    stopAction()
    console.log('New project initialized!')
  }
}
