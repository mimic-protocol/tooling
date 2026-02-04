import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import ManifestHandler from '../lib/ManifestHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { FlagsType } from '../types'

export type CompileFlags = FlagsType<typeof Compile>

export default class Compile extends Command {
  static override description = 'Compiles function'

  static override examples = ['<%= config.bin %> <%= command.id %> --function src/function.ts --output ./output']

  static override flags = {
    function: Flags.string({ char: 'f', description: 'Function to compile', default: 'src/function.ts' }),
    manifest: Flags.string({ char: 'm', description: 'Manifest to validate', default: 'manifest.yaml' }),
    output: Flags.string({ char: 'o', description: 'Output directory', default: './build' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    await Compile.compile(this, flags)
  }

  public static async compile(
    cmd: Command,
    { function: functionDir, output: outputDir, manifest: manifestDir }: CompileFlags
  ): Promise<void> {
    const absFunctionFile = path.resolve(functionDir)
    const absOutputDir = path.resolve(outputDir)

    if (!fs.existsSync(absOutputDir)) fs.mkdirSync(absOutputDir, { recursive: true })

    log.startAction('Verifying Manifest')
    const manifest = ManifestHandler.load(cmd, manifestDir)
    log.startAction('Compiling')

    const ascArgs = [
      absFunctionFile,
      '--target',
      'release',
      '--outFile',
      path.join(absOutputDir, 'function.wasm'),
      '--optimize',
      '--exportRuntime',
      '--transform',
      'json-as/transform',
    ]

    const result = execBinCommand('asc', ascArgs, process.cwd())
    if (result.status !== 0) {
      cmd.error('AssemblyScript compilation failed', {
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
