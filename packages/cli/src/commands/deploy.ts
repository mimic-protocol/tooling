import { Flags } from '@oclif/core'
import { resolve } from 'path'

import { DEFAULT_TASK } from '../constants'
import { build, deploy, MIMIC_REGISTRY_DEFAULT } from '../core'
import { filterTasks, handleCoreError, runTasks, taskFilterFlags, toTaskConfig } from '../helpers'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import log, { coreLogger } from '../log'
import { RequiredTaskConfig } from '../types'

import Authenticate from './authenticate'

export default class Deploy extends Authenticate {
  static override description = 'Uploads your compiled task artifacts to IPFS and registers it into the Mimic Registry'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --input ./dist --output ./dist',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --api-key MY_KEY --input ./dist --output ./dist',
  ]

  static override flags = {
    ...Authenticate.flags,
    input: Flags.string({ char: 'i', description: 'Directory containing the compiled artifacts', default: './build' }),
    output: Flags.string({ char: 'o', description: 'Output directory for deployment CID', default: './build' }),
    url: Flags.string({ char: 'u', description: `Mimic Registry base URL`, default: MIMIC_REGISTRY_DEFAULT }),
    'skip-compile': Flags.boolean({ description: 'Skip codegen and compile steps before uploading', default: false }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy)
    const { profile, 'api-key': apiKey, input, output, 'skip-compile': skipCompile, url, include, exclude } = flags

    if (MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      await runTasks(this, tasks, (task) => this.runForTask(task, url, skipCompile, task.output, profile, apiKey))
    } else {
      await this.runForTask({ ...DEFAULT_TASK, output }, url, skipCompile, input, profile, apiKey)
    }
  }

  private async runForTask(
    task: Omit<RequiredTaskConfig, 'name'>,
    registryUrl: string,
    skipCompile: boolean,
    inputDir: string,
    profile?: string,
    apiKey?: string
  ): Promise<void> {
    const inputPath = resolve(inputDir)
    const outputPath = resolve(task.output)
    const taskConfig = toTaskConfig(task)

    const credentials = this.authenticate({ profile, 'api-key': apiKey })

    try {
      if (!skipCompile) {
        await build(
          {
            manifestPath: taskConfig.manifestPath,
            taskPath: taskConfig.taskPath,
            outputDir: inputPath,
            typesDir: taskConfig.typesDir,
            clean: false,
          },
          coreLogger
        )
      }

      const result = await deploy(
        {
          inputDir: inputPath,
          outputDir: outputPath,
          apiKey: credentials.apiKey,
          registryUrl,
        },
        coreLogger
      )

      coreLogger.info(`IPFS CID: ${log.highlightText(result.cid)}`)
      coreLogger.info(`CID saved at ${log.highlightText(outputPath)}`)
      coreLogger.info(`Task deployed!`)
    } catch (error) {
      handleCoreError(this, error)
    }
  }
}
