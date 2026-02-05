import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import ManifestHandler from '../lib/ManifestHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { FlagsType } from '../types'

import Functions, { FunctionConfig } from './functions'

export type CompileFlags = FlagsType<typeof Compile>

export default class Compile extends Command {
  static override description = 'Compiles function'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --function src/function.ts --build-directory ./build',
  ]

  static override flags = {
    ...Functions.flags,
    function: Flags.string({ char: 'f', description: 'Function to compile', default: 'src/function.ts' }),
    manifest: Flags.string({ char: 'm', description: 'Manifest to validate', default: 'manifest.yaml' }),
    'build-directory': Flags.string({ char: 'b', description: 'Output directory for compilation', default: './build' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    await Compile.compileFunctions(this, Functions.filterFunctions(this, flags), flags)
  }

  public static async compileFunctions(cmd: Command, functions: FunctionConfig[], flags: CompileFlags): Promise<void> {
    for (const func of functions) {
      log.startAction(`Starting compilation for function ${func.name}`)
      await this.compile(cmd, {
        ...flags,
        function: func.function,
        'build-directory': path.join(flags['build-directory'], func.name),
        manifest: func.manifest,
      })
    }
  }

  public static async compile(
    cmd: Command,
    { function: functionDir, 'build-directory': buildDir, manifest: manifestDir }: CompileFlags
  ): Promise<void> {
    const absFunctionFile = path.resolve(functionDir)
    const absBuildDir = path.resolve(buildDir)

    if (!fs.existsSync(absBuildDir)) fs.mkdirSync(absBuildDir, { recursive: true })

    log.startAction('Verifying Manifest')
    const manifest = ManifestHandler.load(cmd, manifestDir)
    log.startAction('Compiling')

    const ascArgs = [
      absFunctionFile,
      '--target',
      'release',
      '--outFile',
      path.join(absBuildDir, 'function.wasm'),
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

    fs.writeFileSync(path.join(absBuildDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${absBuildDir}/`)
  }
}
