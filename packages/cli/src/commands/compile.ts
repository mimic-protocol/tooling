import { RUNNER_TARGET_VERSION } from '@mimicprotocol/lib-ts/constants'
import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

import ManifestHandler from '../lib/ManifestHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { FlagsType } from '../types'

import Functions, { DefaultFunctionConfig } from './functions'

export type CompileFlags = FlagsType<typeof Compile>

export default class Compile extends Command {
  static override description = 'Compiles function'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --function src/function.ts --build-directory ./build',
  ]

  static override flags = {
    ...Functions.flags,
    function: Flags.string({ char: 'f', description: 'Function to compile', default: DefaultFunctionConfig.function }),
    manifest: Flags.string({ char: 'm', description: 'Manifest to validate', default: DefaultFunctionConfig.manifest }),
    'build-directory': Flags.string({
      char: 'b',
      description: 'Output directory for compilation',
      default: DefaultFunctionConfig['build-directory'],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Compile)
    await Functions.runFunctions(this, flags, Compile.compile, 'compilation')
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

    log.startAction('Injecting metadata')
    const wasmPath = path.join(absBuildDir, 'function.wasm')
    const wasmBuffer = fs.readFileSync(wasmPath)
    const metadata = {
      runnerTarget: RUNNER_TARGET_VERSION,
    }
    const wasmWithMetadata = addCustomSection(wasmBuffer, 'mimic-metadata', JSON.stringify(metadata))
    fs.writeFileSync(wasmPath, wasmWithMetadata)

    log.startAction('Saving files')

    fs.writeFileSync(path.join(absBuildDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${absBuildDir}/`)
  }
}

/**
 * Add a custom section to a WASM binary
 * @param wasmBuffer - The original WASM binary
 * @param sectionName - Name of the custom section
 * @param data - String data to store in the section
 * @returns Modified WASM binary with the custom section
 */
function addCustomSection(wasmBuffer: Buffer, sectionName: string, data: string): Buffer {
  const dataBuffer = Buffer.from(data, 'utf-8')
  const nameBuffer = Buffer.from(sectionName, 'utf-8')

  // WASM custom section format:
  // - Section ID: 0 (custom section)
  // - Section size (LEB128) - size of name length + name + data
  // - Name length (LEB128)
  // - Name bytes
  // - Data bytes

  const nameLengthBuffer = encodeLEB128(nameBuffer.length)
  const sectionContentSize = nameLengthBuffer.length + nameBuffer.length + dataBuffer.length
  const sectionSizeBuffer = encodeLEB128(sectionContentSize)

  const customSection = Buffer.concat([
    Buffer.from([0]), // Custom section ID
    sectionSizeBuffer,
    nameLengthBuffer,
    nameBuffer,
    dataBuffer,
  ])

  // Insert after the WASM header (8 bytes: magic + version)
  const headerSize = 8
  return Buffer.concat([wasmBuffer.slice(0, headerSize), customSection, wasmBuffer.slice(headerSize)])
}

/**
 * Encode an unsigned integer as LEB128 (Little Endian Base 128)
 */
function encodeLEB128(value: number): Buffer {
  const bytes: number[] = []
  while (true) {
    let byte = value & 0x7f
    value >>>= 7
    if (value !== 0) {
      byte |= 0x80
    }
    bytes.push(byte)
    if (value === 0) break
  }
  return Buffer.from(bytes)
}
