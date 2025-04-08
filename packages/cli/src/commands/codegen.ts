import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'

import AbisInterfaceGenerator from '../lib/AbisInterfaceGenerator'
import InputsInterfaceGenerator from '../lib/InputsInterfaceGenerator'
import ManifestHandler from '../lib/ManifestHandler'
import log from '../log'
import { Manifest } from '../types'

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
    const manifest = ManifestHandler.load(this, manifestDir)

    if (clean) {
      const shouldDelete = await confirm({
        message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(outputDir)}. This action is ${log.warnText('irreversible')}`,
        default: false,
      })
      if (!shouldDelete) {
        console.log('You can remove the --clean flag from your command')
        console.log('Stopping initialization...')
        this.exit(0)
      }
      log.startAction(`Deleting contents of ${outputDir}`)
      if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true })
    }

    log.startAction('Generating code')
    if (Object.keys(manifest.inputs).length == 0 && Object.keys(manifest.abis).length == 0) {
      log.stopAction()
      return
    }

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    generateAbisCode(manifest, outputDir)
    generateInputsCode(manifest, outputDir)
  }
}

function generateAbisCode(manifest: Manifest, outputDir: string) {
  for (const [contractName, path] of Object.entries(manifest.abis)) {
    const abi = JSON.parse(fs.readFileSync(path, 'utf-8'))
    const abiInterface = AbisInterfaceGenerator.generate(abi, contractName)
    if (abiInterface.length > 0) fs.writeFileSync(`${outputDir}/${contractName}.ts`, abiInterface)
  }
}

function generateInputsCode(manifest: Manifest, outputDir: string) {
  const inputsInterface = InputsInterfaceGenerator.generate(manifest.inputs)
  if (inputsInterface.length > 0) fs.writeFileSync(`${outputDir}/index.ts`, inputsInterface)
}
