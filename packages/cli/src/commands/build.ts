import { Command, Flags } from '@oclif/core'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
export default class Build extends Command {
  static override description = 'Builds task'

  static override examples = ['<%= config.bin %> <%= command.id %> --task src/task.ts --output ./output']

  static override flags = {
    task: Flags.string({ char: 't', description: 'task to build', default: 'src/task.ts' }),
    output: Flags.string({ char: 'o', description: 'output directory', default: './output' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build)
    const { task: taskFile, output: outputDir } = flags

    console.log(`Building AssemblyScript from ${taskFile}...`)
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

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
}
