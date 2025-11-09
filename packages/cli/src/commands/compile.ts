import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import ManifestHandler from '../lib/ManifestHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'

export default class Compile extends Command {
  static override description = 'Compiles task'

  static override examples = ['<%= config.bin %> <%= command.id %> --task src/task.ts --output ./output']

  static override flags = {
    task: Flags.string({ char: 't', description: 'task to compile', default: 'src/task.ts' }),
    manifest: Flags.string({ char: 'm', description: 'manifest to validate', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'output directory', default: './build' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    const { task: taskFile, output: outputDir, manifest: manifestDir } = flags

    const absTaskFile = path.resolve(taskFile)
    const absOutputDir = path.resolve(outputDir)

    if (!fs.existsSync(absOutputDir)) fs.mkdirSync(absOutputDir, { recursive: true })

    log.startAction('Verifying Manifest')
    const manifest = ManifestHandler.load(this, manifestDir)
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

    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${outputDir}/`)
  }
}
