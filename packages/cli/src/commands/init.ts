import { Command, Flags } from '@oclif/core'

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

    console.log(directory, force)
  }
}
