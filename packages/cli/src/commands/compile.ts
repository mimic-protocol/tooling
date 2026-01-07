import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import { DEFAULT_BUILD_OUTPUT, DEFAULT_MANIFEST_FILE, DEFAULT_TASK_ENTRY } from '../constants'
import { filterTasks, taskFilterFlags } from '../helpers'
import ManifestHandler from '../lib/ManifestHandler'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { RequiredTaskConfig } from '../types'

export default class Compile extends Command {
  static override description = 'Compiles task'

  static override examples = ['<%= config.bin %> <%= command.id %> --task src/task.ts --output ./output']

  static override flags = {
    task: Flags.string({ char: 't', description: 'task to compile', default: DEFAULT_TASK_ENTRY }),
    manifest: Flags.string({ char: 'm', description: 'manifest to validate', default: DEFAULT_MANIFEST_FILE }),
    output: Flags.string({ char: 'o', description: 'output directory', default: DEFAULT_BUILD_OUTPUT }),
    'skip-config': Flags.boolean({
      hidden: true,
      description: 'Skip mimic.yaml config (used internally by build command)',
      default: false,
    }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    const {
      task: taskFile,
      output: outputDir,
      manifest: manifestDir,
      include,
      exclude,
      'skip-config': skipConfig,
    } = flags

    if (!skipConfig && MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      for (const task of tasks) {
        console.log(`\n${log.highlightText(`[${task.name}]`)}`)
        await this.runForTask(task)
      }
    } else {
      await this.runForTask({ manifest: manifestDir, entry: taskFile, output: outputDir })
    }
  }

  private async runForTask(task: Omit<RequiredTaskConfig, 'name' | 'types'>): Promise<void> {
    const absTaskFile = path.resolve(task.entry)
    const absOutputDir = path.resolve(task.output)

    if (!fs.existsSync(absOutputDir)) fs.mkdirSync(absOutputDir, { recursive: true })

    log.startAction('Verifying Manifest')
    const manifest = ManifestHandler.load(this, task.manifest)
    log.startAction('Compiling')

    const ascArgs = [
      absTaskFile,
      '--target',
      'release',
      '--outFile',
      path.join(absOutputDir, 'task.wasm'),
      '--optimize',
      '--exportRuntime',
      '--transform',
      'json-as/transform',
    ]

    const result = execBinCommand('asc', ascArgs, process.cwd())
    if (result.status !== 0) {
      this.error('AssemblyScript compilation failed', {
        code: 'BuildError',
        suggestions: ['Check the AssemblyScript file'],
      })
    }

    log.startAction('Saving files')

    fs.writeFileSync(path.join(absOutputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${task.output}/`)
  }
}
