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
    const taskPath = join(path, 'src', 'task.ts')
    const outputPath = join(path, 'build')

    let compilationSuccessful = true

    before('build task', () => {
      const typesOutputPath = join(path, 'src', 'types')
      const resultCodegen = spawnSync('yarn', ['mimic', 'codegen', '-m', manifestPath, '-o', typesOutputPath])

      if (resultCodegen.status !== 0) {
        compilationSuccessful = false
        console.error(`Codegen error in test case '${testCase}':`)
        console.error(resultCodegen.stderr.toString())
        return
      }

      const result = spawnSync('yarn', ['mimic', 'compile', '-m', manifestPath, '-t', taskPath, '-o', outputPath])

      if (result.status !== 0) {
        compilationSuccessful = false
        console.error(`Compilation error in test case '${testCase}':`)
        console.error(result.stderr.toString())
      }
    })

    after('delete artifacts', () => {
      fs.rmSync(outputPath, { recursive: true })
      fs.rmSync(join(path, 'test.log'))
    })

    it('run task', async () => {
      if (!compilationSuccessful) {
        throw new Error(`Unable to run test case '${testCase}' due to compilation errors`)
      }

      const mockRunner = new RunnerMock(outputPath, path)
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
