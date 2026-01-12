import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import { CommandError } from '../errors'
import { filterTasks, runTasks, taskFilterFlags } from '../helpers'
import ManifestHandler from '../lib/ManifestHandler'
import MimicConfigHandler, { MIMIC_CONFIG_FILE } from '../lib/MimicConfigHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { RequiredTaskConfig } from '../types'

export default class Compile extends Command {
  static override description = 'Compiles task'

  static override examples = ['<%= config.bin %> <%= command.id %> --task src/task.ts --output ./output']

  static override flags = {
    task: Flags.string({ char: 't', description: 'task to compile', default: 'src/task.ts' }),
    manifest: Flags.string({ char: 'm', description: 'manifest to validate', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'output directory', default: './build' }),
    'skip-config': Flags.boolean({
      hidden: true,
      description: `Skip ${MIMIC_CONFIG_FILE} config (used internally by build command)`,
      default: false,
    }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    const { task: taskPath, output, manifest, include, exclude, 'skip-config': skipConfig } = flags

    if (!skipConfig && MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      await runTasks(this, tasks, (task) => this.runForTask(task))
    } else {
      await this.runForTask({ manifest, path: taskPath, output })
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name' | 'types'>): Promise<void> {
    const taskPath = path.resolve(task.path)
    const outputDir = path.resolve(task.output)

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    log.startAction('Verifying Manifest')
    const manifest = ManifestHandler.load(this, task.manifest)
    log.startAction('Compiling')

    const ascArgs = [
      taskPath,
      '--target',
      'release',
      '--outFile',
      path.join(outputDir, 'task.wasm'),
      '--optimize',
      '--exportRuntime',
      '--transform',
      'json-as/transform',
    ]

    const result = execBinCommand('asc', ascArgs, process.cwd())
    if (result.status !== 0) {
      throw new CommandError('AssemblyScript compilation failed', {
        code: 'BuildError',
        suggestions: ['Check the AssemblyScript file'],
      })
    }

    log.startAction('Saving files')

    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${task.output}/`)
  }
}
