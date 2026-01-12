import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import { join } from 'path'

import { filterTasks, runTasks, taskFilterFlags } from '../helpers'
import { AbisInterfaceGenerator, InputsInterfaceGenerator, ManifestHandler } from '../lib'
import MimicConfigHandler, { MIMIC_CONFIG_FILE } from '../lib/MimicConfigHandler'
import log from '../log'
import { Manifest, RequiredTaskConfig } from '../types'

export default class Codegen extends Command {
  static override description = 'Generates typed interfaces for declared inputs and ABIs from your manifest.yaml file'

  static override examples = ['<%= config.bin %> <%= command.id %> --manifest ./manifest.yaml --output ./types']

  static override flags = {
    manifest: Flags.string({ char: 'm', description: 'Specify a custom manifest file path', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'Output directory for generated types', default: './src/types' }),
    clean: Flags.boolean({
      char: 'c',
      description: 'Remove existing generated types before generating new files',
      default: false,
    }),
    'skip-config': Flags.boolean({
      hidden: true,
      description: `Skip ${MIMIC_CONFIG_FILE} config (used internally by build command)`,
      default: false,
    }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Codegen)
    const { manifest, output, clean, include, exclude, 'skip-config': skipConfig } = flags

    if (!skipConfig && MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      await runTasks(this, tasks, (task) => this.runForTask(task, clean))
    } else {
      await this.runForTask({ manifest, types: output }, clean)
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name' | 'path' | 'output'>, clean: boolean): Promise<void> {
    const manifestPath = task.manifest
    const outputDir = task.types
    const manifest = ManifestHandler.load(this, manifestPath)

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
    if (Object.keys(manifest.inputs).length === 0 && Object.keys(manifest.abis).length === 0) {
      log.stopAction()
      return
    }

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    generateAbisCode(manifest, outputDir, manifestPath)
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
