import { expect } from 'chai'
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

    before('validate mock.json', () => {
      const environment = JSON.parse(fs.readFileSync(join(outputPath, 'environment.json'), 'utf8'))
      const mock = JSON.parse(fs.readFileSync(join(path, 'mock.json'), 'utf8'))
      const mockKeys = Object.keys(mock)
      const ok = !environment.some((e) => !mockKeys.includes(e))
      expect(ok, 'Mock.json does not have all necesary elements').to.be.true
    })

    it('run task', async () => {
      try {
        const mr = new MockRunner(outputPath)
        mr.run()
      } catch (err) {
        console.log(err)
      }
    })
  })
}
