import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import { join } from 'path'

import { AbisInterfaceGenerator, InputsInterfaceGenerator, ManifestHandler } from '../lib'
import log from '../log'
import { FlagsType, Manifest } from '../types'

import Functions, { DefaultFunctionConfig } from './functions'

export type CodegenFlags = FlagsType<typeof Codegen>

export default class Codegen extends Command {
  static override description = 'Generates typed interfaces for declared inputs and ABIs from your manifest.yaml file'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --types-directory ./types',
  ]

  static override flags = {
    ...Functions.flags,
    manifest: Flags.string({
      char: 'm',
      description: 'Specify a custom manifest file path',
      default: DefaultFunctionConfig.manifest,
    }),
    'types-directory': Flags.string({
      char: 't',
      description: 'Output directory for generated types',
      default: DefaultFunctionConfig['types-directory'],
    }),
    clean: Flags.boolean({
      char: 'c',
      description: 'Remove existing generated types before generating new files',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Codegen)
    await Functions.runFunctions(this, flags, Codegen.codegen, 'code generation')
  }

  public static async codegen(cmd: Command, flags: CodegenFlags): Promise<void> {
    const { manifest: manifestDir, 'types-directory': typesDir, clean } = flags
    const manifest = ManifestHandler.load(cmd, manifestDir)
    if (clean) {
      const shouldDelete = await confirm({
        message: `Are you sure you want to ${log.warnText('delete')} all the contents in ${log.highlightText(typesDir)}. This action is ${log.warnText('irreversible')}`,
        default: false,
      })
      if (!shouldDelete) {
        console.log('You can remove the --clean flag from your command')
        console.log('Stopping initialization...')
        cmd.exit(0)
      }
      log.startAction(`Deleting contents of ${typesDir}`)
      if (fs.existsSync(typesDir)) fs.rmSync(typesDir, { recursive: true, force: true })
    }

    log.startAction('Generating code')
    if (Object.keys(manifest.inputs).length == 0 && Object.keys(manifest.abis).length == 0) {
      log.stopAction()
      return
    }

    if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true })
    this.generateAbisCode(manifest, typesDir, manifestDir)
    this.generateInputsCode(manifest, typesDir)
    log.stopAction()
  }

  private static generateAbisCode(manifest: Manifest, typesDir: string, manifestDir: string) {
    for (const [contractName, path] of Object.entries(manifest.abis)) {
      const abi = JSON.parse(fs.readFileSync(join(manifestDir, '../', path), 'utf-8'))
      const abiInterface = AbisInterfaceGenerator.generate(abi, contractName)
      if (abiInterface.length > 0) fs.writeFileSync(`${typesDir}/${contractName}.ts`, abiInterface)
    }
  }

  private static generateInputsCode(manifest: Manifest, typesDir: string) {
    const inputsInterface = InputsInterfaceGenerator.generate(manifest.inputs)
    if (inputsInterface.length > 0) fs.writeFileSync(`${typesDir}/index.ts`, inputsInterface)
  }
}
