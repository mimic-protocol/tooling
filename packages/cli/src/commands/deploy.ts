import { Flags } from '@oclif/core'
import { resolve } from 'path'

import { DEFAULT_TASK } from '../constants'
import { build, deploy, MIMIC_REGISTRY_DEFAULT } from '../core'
import { runTasks } from '../helpers'
import MimicConfigHandler, { taskFilterFlags } from '../lib/MimicConfigHandler'
import log, { coreLogger } from '../log'

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
    input: Flags.string({ char: 'i', description: 'Directory containing the compiled artifacts' }),
    output: Flags.string({ char: 'o', description: 'Output directory for deployment CID', default: './build' }),
    url: Flags.string({ char: 'u', description: `Mimic Registry base URL`, default: MIMIC_REGISTRY_DEFAULT }),
    'skip-compile': Flags.boolean({ description: 'Skip codegen and compile steps before uploading', default: false }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy)
    const { profile, 'api-key': apiKey, input, output, 'skip-compile': skipCompile, url, include, exclude } = flags

    const tasks = MimicConfigHandler.getFilteredTasks(this, {
      defaultTask: { ...DEFAULT_TASK, output },
      include,
      exclude,
    })
    await runTasks(this, tasks, async (config) => {
      const inputPath = resolve(input ?? config.output)
      const outputPath = resolve(config.output)

      const credentials = this.authenticate({ profile, 'api-key': apiKey })

      if (!skipCompile) {
        await build(
          {
            manifestPath: config.manifest,
            taskPath: config.task,
            outputDir: inputPath,
            typesDir: config.types,
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
          registryUrl: url,
        },
        coreLogger
      )

      coreLogger.info(`IPFS CID: ${log.highlightText(result.cid)}`)
      coreLogger.info(`CID saved at ${log.highlightText(outputPath)}`)
      coreLogger.info(`Task deployed!`)
    })
  }
}
