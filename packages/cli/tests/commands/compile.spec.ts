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
  const mimicConfigPath = path.join(process.cwd(), 'mimic.yaml')

  afterEach('delete generated files', () => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
    if (fs.existsSync(mimicConfigPath)) fs.unlinkSync(mimicConfigPath)
  })

  const buildCommand = (manifestPath: string, taskPath: string, outputDir: string) => {
    return ['compile', `--task ${taskPath}`, `--manifest ${manifestPath}`, `--output ${outputDir}`]
  }

  const itCreatesFilesCorrectly = (manifestPath: string, expectedInputs: object) => {
    it('creates the files correctly', async () => {
      const command = buildCommand(manifestPath, taskPath, outputDir)
      const { stdout, error } = await runCommand(command)

      expect(error).to.be.undefined
      expect(stdout).to.include('Build complete!')

      expect(fs.existsSync(`${outputDir}/task.wasm`)).to.be.true
      expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

      const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))

      expect(manifest.inputs).to.be.deep.equal(expectedInputs)
    })
  }

  context('when the mimic config exists', () => {
    beforeEach('create mimic.yaml', () => {
      fs.writeFileSync(
        mimicConfigPath,
        `tasks:\n  - name: test-task\n    manifest: ${manifestPath}\n    entry: ${taskPath}\n    output: ${outputDir}\n`
      )
    })

    it('creates the files correctly for task from config', async () => {
      const expectedInputs = {
        firstStaticNumber: 'uint32',
        secondStaticNumber: 'uint32',
        isTrue: 'bool',
      }

      const command = ['compile']
      const { stdout, error } = await runCommand(command)

      expect(error).to.be.undefined
      expect(stdout).to.include('[test-task]')
      expect(stdout).to.include('Build complete!')

      expect(fs.existsSync(`${outputDir}/task.wasm`)).to.be.true
      expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

      const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))
      expect(manifest.inputs).to.be.deep.equal(expectedInputs)
    })
  })

  context('when the mimic config does not exist', () => {
    beforeEach('ensure mimic.yaml does not exist', () => {
      if (fs.existsSync(mimicConfigPath)) fs.unlinkSync(mimicConfigPath)
    })

    context('when the manifest exists', () => {
      context('when the manifest is valid', () => {
        context('when the task compiles successfully', () => {
          context('when the manifest has simple inputs', () => {
            const expectedInputs = {
              firstStaticNumber: 'uint32',
              secondStaticNumber: 'uint32',
              isTrue: 'bool',
            }
            itCreatesFilesCorrectly(manifestPath, expectedInputs)
          })

          context('when the manifest has inputs with descriptions', () => {
            const manifestPath = `${basePath}/manifests/manifest-with-descriptions.yaml`
            const expectedInputs = {
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
            }
            itCreatesFilesCorrectly(manifestPath, expectedInputs)
          })
        })

        context('when the task fails to compile', () => {
          const taskPath = `${basePath}/tasks/invalid-task.ts`
          const command = buildCommand(manifestPath, taskPath, outputDir)

          itThrowsACliError(command, 'AssemblyScript compilation failed', 'BuildError', 1)
        })
      })

      context('when the manifest is not valid', () => {
        context('when the manfiest has invalid fields', () => {
          const manifestPath = `${basePath}/manifests/invalid-manifest.yaml`
          const command = buildCommand(manifestPath, taskPath, outputDir)

          itThrowsACliError(command, 'More than one entry', 'MoreThanOneEntryError', 1)
        })

        context('when the manfiest has repeated fields', () => {
          const manifestPath = `${basePath}/manifests/invalid-manifest-repeated.yaml`
          const command = buildCommand(manifestPath, taskPath, outputDir)

          itThrowsACliError(command, 'Duplicate Entry', 'DuplicateEntryError', 1)
        })

        context('when the manifest is incomplete', () => {
          const manifestPath = `${basePath}/manifests/incomplete-manifest.yaml`
          const command = buildCommand(manifestPath, taskPath, outputDir)

          itThrowsACliError(command, 'Missing/Incorrect Fields', 'FieldsError', 3)
        })

        context('when the manifest is empty', () => {
          const manifestPath = `${basePath}/manifests/empty-manifest.yaml`
          const command = buildCommand(manifestPath, taskPath, outputDir)

          itThrowsACliError(command, 'Empty Manifest', 'EmptyManifestError', 1)
        })
      })
    })

    context('when the manifest does not exist', () => {
      const inexistentManifestPath = `${manifestPath}-none`
      const command = buildCommand(inexistentManifestPath, taskPath, outputDir)

      itThrowsACliError(command, `Could not find ${inexistentManifestPath}`, 'FileNotFound', 1)
    })

    context('when the output directory already exists', () => {
      beforeEach('create outputDirectory with files', () => {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
        fs.writeFileSync(path.join(outputDir, 'randomFile.txt'), JSON.stringify({ a: 2 }, null, 2))
      })

      const expectedInputs = {
        firstStaticNumber: 'uint32',
        secondStaticNumber: 'uint32',
        isTrue: 'bool',
      }
      itCreatesFilesCorrectly(manifestPath, expectedInputs)
    })
  })
})
