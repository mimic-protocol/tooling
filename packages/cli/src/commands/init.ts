import { confirm, input } from '@inquirer/prompts'
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
    useDefault: Flags.boolean({ char: 'y', description: 'Use default task name without asking', default: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init)
    const { directory, force, useDefault } = flags
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
      log.stopAction()
    }

    let taskName = 'mimic-task'

    if (!useDefault) {
      taskName = await input({
        message: 'Give a name to your task:',
        default: 'mimic-task',
      })
    } else {
      console.log(`Using default task name: ${log.highlightText(taskName)}`)
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

    fs.cpSync(templateDirectory, fullDirectory, { recursive: true })

    if (!useDefault) {
      const packageJsonPath = path.join(fullDirectory, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        packageJson.name = taskName.replace(/\s+/g, '-')
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      }
    }
    log.stopAction()

    log.startAction('Installing dependencies')
    spawnSync('yarn', ['install'], {
      cwd: fullDirectory,
      stdio: 'inherit',
    })
    log.stopAction()

    console.log('New project initialized!')
  }
}
