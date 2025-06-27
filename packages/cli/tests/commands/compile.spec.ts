import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import { itThrowsACliError } from '../helpers'

describe('compile', () => {
  const basePath = `${__dirname}/../fixtures`
  const taskPath = `${basePath}/tasks/task.ts`
  const manifestPath = `${basePath}/manifests/manifest.yaml`
  const outputDir = `${basePath}/output`

  afterEach('delete generated files', () => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  const itCreatesFilesCorrectly = (manifestPath: string, expectedInputs: object) => {
    it('creates the files correctly', async () => {
      const { stdout, error } = await runCommand(buildCommand(manifestPath, taskPath, outputDir))

      expect(error).to.be.undefined
      expect(stdout).to.include('Build complete!')

      expect(fs.existsSync(`${outputDir}/task.wasm`)).to.be.true
      expect(fs.existsSync(`${outputDir}/task.wat`)).to.be.true
      expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

      const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))

      expect(manifest.inputs).to.be.deep.equal(expectedInputs)
    })
  }

  context('when the manifest exists', () => {
    context('when the manifest is valid', () => {
      context('when the task compiles successfully', () => {
        context('when the manifest has simple inputs', () => {
          itCreatesFilesCorrectly(manifestPath, {
            firstStaticNumber: 'uint32',
            secondStaticNumber: 'uint32',
            isTrue: 'bool',
          })
        })

        context('when the manifest has inputs with descriptions', () => {
          itCreatesFilesCorrectly(`${basePath}/manifests/manifest-with-descriptions.yaml`, {
            firstStaticNumber: 'uint32',
            describedNumber: {
              type: 'uint32',
              description: 'A number parameter with detailed description',
            },
            tokenAddress: {
              type: 'address',
              description: 'The address of the ERC20 token contract',
            },
            simpleFlag: 'bool',
          })
        })
      })

      context('when the task fails to compile', () => {
        const command = buildCommand(`${basePath}/tasks/invalid-task.ts`, taskPath, outputDir)

        itThrowsACliError(command, 'AssemblyScript compilation failed', 'BuildError', 1)
      })
    })

    context('when the manifest is not valid', () => {
      context('when the manfiest has invalid fields', () => {
        const command = buildCommand(`${basePath}/manifests/invalid-manifest.yaml`, taskPath, outputDir)

        itThrowsACliError(command, 'More than one entry', 'MoreThanOneEntryError', 1)
      })

      context('when the manfiest has repeated fields', () => {
        const command = buildCommand(`${basePath}/manifests/invalid-manifest-repeated.yaml`, taskPath, outputDir)

        itThrowsACliError(command, 'Duplicate Entry', 'DuplicateEntryError', 1)
      })

      context('when the manifest is incomplete', () => {
        const command = buildCommand(`${basePath}/manifests/incomplete-manifest.yaml`, taskPath, outputDir)

        itThrowsACliError(command, 'Missing/Incorrect Fields', 'FieldsError', 3)
      })

      context('when the manifest is empty', () => {
        const command = buildCommand(`${basePath}/manifests/empty-manifest.yaml`, taskPath, outputDir)

        itThrowsACliError(command, 'Empty Manifest', 'EmptyManifestError', 1)
      })
    })
  })

  context('when the manifest does not exist', () => {
    let inexistentManifestPath = `${manifestPath}-none`
    const command = buildCommand(inexistentManifestPath, taskPath, outputDir)

    itThrowsACliError(command, `Could not find ${inexistentManifestPath}`, 'FileNotFound', 1)
  })

  context('when the output directory already exists', () => {
    beforeEach('create outputDirectory with files', () => {
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
      fs.writeFileSync(path.join(outputDir, 'randomFile.txt'), JSON.stringify({ a: 2 }, null, 2))
    })

    itCreatesFilesCorrectly(manifestPath, {
      firstStaticNumber: 'uint32',
      secondStaticNumber: 'uint32',
      isTrue: 'bool',
    })
  })
})

function buildCommand(manifestPath: string, taskPath: string, outputDir: string) {
  return ['compile', `--task ${taskPath}`, `--manifest ${manifestPath}`, `--output ${outputDir}`]
}
