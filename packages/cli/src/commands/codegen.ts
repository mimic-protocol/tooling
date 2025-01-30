import { Command, Flags } from '@oclif/core'

export default class Codegen extends Command {
  static override description = 'Generates typed interfaces for declared inputs and ABIs from your manifest.yaml file'

  static override examples = ['<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --output ./types']

  static override flags = {
    manifest: Flags.string({ char: 'm', description: 'Specify a custom manifest file path', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'Ouput directory for generated types', default: './types' }),
    clean: Flags.boolean({
      char: 'c',
      description: 'Remove existing generated types before generating new files',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Codegen)
    const { manifest: manifestDir, output: outputDir, clean } = flags

    console.log(manifestDir, outputDir, clean)
  }
}
