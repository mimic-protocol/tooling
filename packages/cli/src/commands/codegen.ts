import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import { load } from 'js-yaml'

import { generateAbiInterface } from '../InterfaceGenerator'
import { validateManifest } from '../ManifestValidator'

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
    }), // TODO: Implement this
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Codegen)
    const { manifest: manifestDir, output: outputDir } = flags

    let loadedManifest
    try {
      loadedManifest = load(fs.readFileSync(manifestDir, 'utf-8'))
    } catch {
      this.error(`Could not find ${manifestDir}`, {
        code: 'FileNotFound',
        suggestions: ['Use the -m or --manifest flag to specify the correct path'],
      })
    }
    const manifest = validateManifest(loadedManifest)

    if (Object.keys(manifest.abis).length > 0 && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    for (const [contractName, path] of Object.entries(manifest.abis)) {
      const abi = JSON.parse(fs.readFileSync(path, 'utf-8'))
      const abiInterface = generateAbiInterface(abi, contractName)
      if (abiInterface.length > 0) fs.writeFileSync(`${outputDir}/${contractName}.ts`, abiInterface)
    }
  }
}
