import { RunnerMock } from '@mimicprotocol/test-ts'
import { expect } from 'chai'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import { join } from 'path'

describe('Integration tests', async () => {
  const testCases = fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  await Promise.all(testCases.map(runTestCase))

  after('lint', () => {
    const resultLint = spawnSync('yarn', ['lint', '--fix'])
    if (resultLint.status !== 0) {
      console.error('Linting errors:')
      console.error(resultLint.stderr.toString())
    }
  })
})

async function runTestCase(testCase: string): Promise<void> {
  describe(testCase, () => {
    const path = join(__dirname, testCase)
    const manifestPath = join(path, 'manifest.yaml')
    const functionPath = join(path, 'src', 'function.ts')
    const buildDirectory = join(path, 'build')

    let compilationSuccessful = true

    before('build function', () => {
      const typesOutputPath = join(path, 'src', 'types')
      const resultBuild = spawnSync('yarn', [
        'mimic',
        'build',
        '-m',
        manifestPath,
        '-t',
        typesOutputPath,
        '-b',
        buildDirectory,
        '-f',
        functionPath,
      ])

      if (resultBuild.status !== 0) {
        compilationSuccessful = false
        console.error(`Build error in test case '${testCase}':`)
        console.error(resultBuild.stderr.toString())
        return
      }
    })

    after('delete artifacts', () => {
      fs.rmSync(buildDirectory, { recursive: true })
      fs.rmSync(join(path, 'test.log'))
    })

    it('run function', async () => {
      if (!compilationSuccessful) {
        throw new Error(`Unable to run test case '${testCase}' due to compilation errors`)
      }

      const mockRunner = new RunnerMock(buildDirectory, path)
      mockRunner.run()
      const expectedLogs = loadLogs(join(path, 'expected.log'))
      const testLogs = loadLogs(join(path, 'test.log'))
      expect(testLogs).to.be.deep.equal(expectedLogs)
    })
  })
}

function loadLogs(path: string): string[] {
  return fs
    .readFileSync(path, { encoding: 'utf-8' })
    .split('\n')
    .filter((line) => line !== '')
}
