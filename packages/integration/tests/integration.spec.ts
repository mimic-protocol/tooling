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
      const mockRunner = new MockRunner(outputPath)
      mockRunner.run()
      const expectedLogs = loadLogs(join(path, 'expected.log'))
      const testLogs = loadLogs(join(outputPath, 'test.log'))
      expect(expectedLogs).to.be.deep.equal(testLogs)
    })
  })
}

function loadLogs(path: string): string[] {
  return fs.readFileSync(path, { encoding: 'utf-8'}).split("\n").filter(line => line !== "")
}