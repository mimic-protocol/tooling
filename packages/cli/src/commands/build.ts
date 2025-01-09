import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

export default function (args: string[]) {
  let taskFile = 'src/task.ts'
  let outputDir = 'build'
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task') taskFile = args[++i]
    if (args[i] === '--output') outputDir = args[++i]
  }

  console.log(`Building AssemblyScript from ${taskFile}...`)
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const ascArgs = [
    taskFile,
    '--target', 'release',
    '--outFile', path.join(outputDir, 'task.wasm'),
    '--textFile', path.join(outputDir, 'task.wat'),
    '--optimize'
  ]

  const result = spawnSync('asc', ascArgs, { stdio: 'inherit' })
  if (result.status !== 0) {
    console.error('AssemblyScript compilation failed')
    process.exit(result.status || 1)
  }

  const fileContents = fs.readFileSync(taskFile, 'utf-8')
  const environmentCalls: string[] = extractEnvironmentCalls(fileContents)
  const inputsJson = { environmentCalls }
  fs.writeFileSync(path.join(outputDir, 'inputs.json'), JSON.stringify(inputsJson, null, 2))
  console.log(`Build complete! Artifacts in ${outputDir}/`)
}

function extractEnvironmentCalls(source: string): string[] {
  const environmentCalls = new Set<string>()

  const sourceFile = ts.createSourceFile(
    'task.ts',
    source,
    ts.ScriptTarget.ES2020,
    true,
    ts.ScriptKind.TS
  )

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