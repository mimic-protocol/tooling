import { spawnSync } from 'child_process'
import * as fs from 'fs'
import { join } from 'path'

import MockRunner from '../src/MockRunner'

describe('Integration tests', async () => {
  const testCases = fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  await Promise.all(testCases.map(runTestCase))
})

async function runTestCase(testCase: string): Promise<void> {
  describe(testCase, () => {
    const path = join(__dirname, testCase)
    const manifestPath = join(path, 'manifest.yaml')
    const taskPath = join(path, 'src', 'task.ts')
    const outputPath = join(path, 'build')

    before('build task', () => {
      spawnSync('yarn', ['mimic', 'compile', '-m', manifestPath, '-t', taskPath, '-o', outputPath])
    })

    after('delete artifacts', () => {
      fs.rmSync(outputPath, { recursive: true })
    })

    it('run task', async () => {
      try {
        const a = MockRunner.run(outputPath)
        console.log(a)
      } catch (err) {
        console.log(err)
      }
    })
  })
}
