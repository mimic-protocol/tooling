import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

import log from '../log'
import ManifestHandler from '../ManifestHandler'
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

    const ascArgs = [
      taskFile,
      '--target',
      'release',
      '--outFile',
      path.join(outputDir, 'task.wasm'),
      '--textFile',
      path.join(outputDir, 'task.wat'),
      '--optimize',
    ]

    const result = spawnSync('asc', ascArgs, { stdio: 'inherit' })
    if (result.status !== 0) {
      this.error('AssemblyScript compilation failed', {
        code: 'BuildError',
        suggestions: ['Check the AssemblyScript file'],
      })
    }

    log.startAction('Saving files')

    const fileContents = fs.readFileSync(taskFile, 'utf-8')
    const environmentCalls = extractCalls(fileContents, 'environment')
    const oracleCalls = extractCalls(fileContents, 'oracle')
    fs.writeFileSync(
      path.join(outputDir, 'inputs.json'),
      JSON.stringify({ ...environmentCalls, ...oracleCalls }, null, 2)
    )
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${outputDir}/`)
  }
}

function extractCalls(source: string, callIdentifier: string): { [key: string]: string[] } {
  const calls = new Set<string>()
  const sourceFile = ts.createSourceFile('task.ts', source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS)

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const { expression, name } = node.expression
      if (ts.isIdentifier(expression) && expression.escapedText === callIdentifier) {
        calls.add(name.escapedText.toString())
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return { [callIdentifier]: Array.from(calls) }
}
