import { spawnSync } from 'child_process'
import { join } from 'path'

import { RunnerFailureError, RunnerSpawnError } from './errors'

export default {
  run(taskFolder: string): string {
    const subFolder = process.env.NODE_ENV === 'production' ? 'release' : 'debug'
    const runnerPath = join(__dirname, `../mock-runner/target/${subFolder}/mock-runner`)
    const taskPath = join(taskFolder, 'task.wasm')
    const environmentPath = join(taskFolder, 'environment.json')
    const manifestPath = join(taskFolder, 'manifest.json')

    const result = spawnSync(runnerPath, [taskPath, environmentPath, manifestPath], { encoding: 'utf-8' })

    if (result.error) throw new RunnerSpawnError(result.error.message)
    if (result.status !== 0) throw new RunnerFailureError(result.status, result.stderr)
    console.log('Command succeeded!')
    return result.stdout
  },
}
