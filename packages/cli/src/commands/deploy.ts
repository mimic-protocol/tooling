import { Command, Flags } from '@oclif/core'

export default class Deploy extends Command {
  static override description = 'Uploads your compiled task artifacts to IPFS and registers it into the Mimic Registry'

  static override examples = ['<%= config.bin %> <%= command.id %> --input ./dist --key MY_KEY --output ./dist']

  static override flags = {
    key: Flags.string({ char: 'k', description: 'Your account deployment key' }),
    input: Flags.string({ char: 'i', description: 'Directory containing the compiled artifacts', default: './build' }),
    output: Flags.string({ char: 'o', description: 'Output directory for deployment CID', default: './build' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy)
    const { key, input: inputDir, output: outputDir } = flags

    console.log(key, inputDir, outputDir)
  }
}
