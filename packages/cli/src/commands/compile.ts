import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import log from '../log'
import ManifestHandler from '../ManifestHandler'

type FunctionsMap = {
  [namespace: string]: {
    [subNamespace: string]: string[]
  }
}

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
      taskFile,
      '--target',
      'release',
      '--outFile',
      wasmPath,
      '--textFile',
      watPath,
      '--optimize',
      '--transform',
      'json-as/transform',
    ]

    const result = spawnSync('asc', ascArgs, { stdio: 'inherit' })
    if (result.status !== 0) {
      this.error('AssemblyScript compilation failed', {
        code: 'BuildError',
        suggestions: ['Check the AssemblyScript file'],
      })
    }

    log.startAction('Saving files')

    const functionCalls = extractCalls(watPath)
    fs.writeFileSync(path.join(outputDir, 'inputs.json'), JSON.stringify(functionCalls, null, 2))
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${outputDir}/`)
  }
}

function extractCalls(watPath: string): FunctionsMap {
  const fileContent = fs.readFileSync(watPath, 'utf8')
  const lines = fileContent.split('\n')

  const result: FunctionsMap = {}

  const importRegex = /\(import\s+"([^"]+)"\s+"([^"]+)"\s+\(func\s+\$[^\s)]+/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('(import')) continue

    const match = trimmed.match(importRegex)
    if (!match) continue

    const namespace = match[1]
    const funcFullName = match[2]

    if (namespace === 'env') continue

    const parts = funcFullName.split('.')
    if (parts.length < 2) continue
    const subNamespace = parts[0]
    const funcName = parts.slice(1).join('.')

    if (!result[namespace]) {
      result[namespace] = {}
    }
    if (!result[namespace][subNamespace]) {
      result[namespace][subNamespace] = []
    }
    result[namespace][subNamespace].push(funcName)
  }

  return sortInputs(result)
}

function sortInputs(inputs: FunctionsMap): FunctionsMap {
  const sortedInputs: FunctionsMap = {}
  Object.keys(inputs)
    .sort()
    .forEach((ns) => {
      sortedInputs[ns] = {}
      Object.keys(inputs[ns])
        .sort()
        .forEach((subNs) => {
          sortedInputs[ns][subNs] = inputs[ns][subNs].sort()
        })
    })
  return sortedInputs
}
