import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

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

  // This should be done using AST instead
  const fileContents = fs.readFileSync(taskFile, 'utf-8')
  const environmentCalls: string[] = []
  if (fileContents.includes('environment.getNumber')) environmentCalls.push('getNumber')
  const inputsJson = { environmentCalls }
  fs.writeFileSync(path.join(outputDir, 'inputs.json'), JSON.stringify(inputsJson, null, 2))
  console.log(`Build complete! Artifacts in ${outputDir}/`)
}
