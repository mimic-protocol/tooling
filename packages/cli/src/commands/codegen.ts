import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import { join } from 'path'

import { filterTasks, taskFilterFlags } from '../helpers'
import { AbisInterfaceGenerator, InputsInterfaceGenerator, ManifestHandler, MimicConfigHandler } from '../lib'
import log from '../log'
import { Manifest, RequiredTaskConfig } from '../types'

export default class Codegen extends Command {
  static override description = 'Generates typed interfaces for declared inputs and ABIs from your manifest.yaml file'

  static override examples = ['<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --output ./types']

  static override flags = {
    manifest: Flags.string({ char: 'm', description: 'Specify a custom manifest file path', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'Ouput directory for generated types', default: './src/types' }),
    clean: Flags.boolean({
      char: 'c',
      description: 'Remove existing generated types before generating new files',
      default: false,
    }),
    ['skip-config']: Flags.boolean({
      hidden: true,
      description: 'Skip mimic.yaml config (used internally by build command)',
      default: false,
    }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Codegen)
    const { manifest: manifestDir, output: outputDir, clean, include, exclude, ['skip-config']: skipConfig } = flags

    if (!skipConfig && MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      for (const task of tasks) {
        console.log(`\n${log.highlightText(`[${task.name}]`)}`)
        await this.runForTask(task, clean)
      }
    } else {
      await this.runForTask({ manifest: manifestDir, types: outputDir }, clean)
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name' | 'entry' | 'output'>, clean: boolean): Promise<void> {
    const manifestDir = task.manifest
    const outputDir = task.types
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

    generateAbisCode(manifest, outputDir, manifestDir)
    generateInputsCode(manifest, outputDir)
    log.stopAction()
  }
}

function generateAbisCode(manifest: Manifest, outputDir: string, manifestDir: string) {
  for (const [contractName, path] of Object.entries(manifest.abis)) {
    const abi = JSON.parse(fs.readFileSync(join(manifestDir, '../', path), 'utf-8'))
    const abiInterface = AbisInterfaceGenerator.generate(abi, contractName)
    if (abiInterface.length > 0) fs.writeFileSync(`${outputDir}/${contractName}.ts`, abiInterface)
  }
}

function generateInputsCode(manifest: Manifest, outputDir: string) {
  const inputsInterface = InputsInterfaceGenerator.generate(manifest.inputs)
  if (inputsInterface.length > 0) fs.writeFileSync(`${outputDir}/index.ts`, inputsInterface)
}
