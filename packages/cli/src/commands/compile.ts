import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'
import * as ts from 'typescript'
import { ZodError } from 'zod'

import { DuplicateEntryError, EmptyManifestError, MoreThanOneEntryError } from '../errors'
import { log } from '../logger'
import { validateManifest } from '../ManifestValidator'

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

    let loadedManifest
    try {
      loadedManifest = load(fs.readFileSync(manifestDir, 'utf-8'))
    } catch {
      this.error(`Could not find ${manifestDir}`, {
        code: 'FileNotFound',
        suggestions: ['Use the --manifest flag to specify the correct path'],
      })
    }
    let manifest
    try {
      manifest = validateManifest(loadedManifest)
    } catch (err) {
      this.handleValidationError(err)
    }
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
    const environmentCalls = extractEnvironmentCalls(fileContents)
    fs.writeFileSync(path.join(outputDir, 'inputs.json'), JSON.stringify(environmentCalls, null, 2))
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log.stopAction()
    console.log(`Build complete! Artifacts in ${outputDir}/`)
  }

  private handleValidationError(err: unknown) {
    let message: string
    let code: string
    let suggestions: string[]

    if (err instanceof MoreThanOneEntryError) {
      ;[message, code] = [err.message, err.name]
      suggestions = [`${err.location[1][0]}: ${err.location[1][1]} might be missing a prepended '-' on manifest`]
    } else if (err instanceof DuplicateEntryError) {
      ;[message, code] = [err.message, err.name]
      suggestions = [`Review manifest for duplicate key: ${err.duplicateKey}`]
    } else if (err instanceof EmptyManifestError) {
      ;[message, code] = [err.message, err.name]
      suggestions = ['Verify if you are using the correct manifest file']
    } else if (err instanceof ZodError) {
      ;[message, code] = ['Missing/Incorrect Fields', 'FieldsError']
      suggestions = err.errors.map((e) => `${e.path.join('/')}: ${e.message}`)
    } else {
      ;[message, code] = [`Unkown Error: ${err}`, 'UnknownError']
      suggestions = [
        'Contact the Mimic team for further assistance at our website https://www.mimic.fi/ or discord https://discord.com/invite/cpcyV9EsEg',
      ]
    }

    this.error(message, { code, suggestions })
  }
}

function extractEnvironmentCalls(source: string): string[] {
  const environmentCalls = new Set<string>()
  const sourceFile = ts.createSourceFile('task.ts', source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS)

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const { expression, name } = node.expression
      if (ts.isIdentifier(expression) && expression.escapedText === 'environment') {
        environmentCalls.add(name.escapedText.toString())
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return Array.from(environmentCalls)
}
