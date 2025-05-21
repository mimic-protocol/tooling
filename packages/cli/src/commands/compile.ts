import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import ManifestHandler from '../lib/ManifestHandler'
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

    console.log(`Compiling AssemblyScript from ${taskFile}`)
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    log.startAction('Verifying Manifest')
    const manifest = ManifestHandler.load(this, manifestDir)
    log.startAction('Compiling')

    const wasmPath = path.join(outputDir, 'task.wasm')
    const watPath = path.join(outputDir, 'task.wat')

    const ascArgs = [
      'asc',
      taskFile,
      '--target',
      'release',
      '--outFile',
      wasmPath,
      '--textFile',
      watPath,
      '--optimize',
      '--exportRuntime',
      '--transform',
      'json-as/transform'
    ]

    const result = spawnSync('yarn', ascArgs, { stdio: 'inherit' })
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
