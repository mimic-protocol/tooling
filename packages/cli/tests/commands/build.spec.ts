import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import { itThrowsACliError } from '../helpers'

describe('build', () => {
  const basePath = `${__dirname}/../fixtures`
  const taskPath = `${basePath}/tasks/task.ts`
  const manifestPath = `${basePath}/manifests/manifest.yaml`
  const outputDir = `${basePath}/output`
  const typesDir = `${basePath}/src/types`
  const mimicConfigPath = path.join(process.cwd(), 'mimic.yaml')

  afterEach('cleanup generated files', () => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
    if (fs.existsSync(typesDir)) fs.rmSync(typesDir, { recursive: true })
    if (fs.existsSync(mimicConfigPath)) fs.unlinkSync(mimicConfigPath)
  })

  const buildCommand = (args: string[] = []) => {
    return ['build', ...args]
  }

  const withCommonFlags = (manifest: string, task: string, output: string, types: string, extra: string[] = []) => {
    return [`--manifest ${manifest}`, `--task ${task}`, `--output ${output}`, `--types ${types}`, ...extra]
  }

  const itBuildsAndGeneratesTypes = (manifest: string, expectedInputs: object) => {
    it('generates types and build artifacts', async () => {
      const command = buildCommand(withCommonFlags(manifest, taskPath, outputDir, typesDir))
      const { stdout, error } = await runCommand(command)

      expect(error).to.be.undefined
      expect(stdout).to.include('Build complete!')

      // build artifacts
      expect(fs.existsSync(path.join(outputDir, 'task.wasm'))).to.be.true
      expect(fs.existsSync(path.join(outputDir, 'manifest.json'))).to.be.true

      // generated types
      expect(fs.existsSync(path.join(typesDir, 'index.ts'))).to.be.true
      expect(fs.existsSync(path.join(typesDir, 'ERC20.ts'))).to.be.true

      const manifestJson = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf-8'))
      expect(manifestJson.inputs).to.be.deep.equal(expectedInputs)
    })
  }

  context('when the mimic config exists', () => {
    beforeEach('create mimic.yaml', () => {
      fs.writeFileSync(
        mimicConfigPath,
        `tasks:\n  - name: test-task\n    manifest: ${manifestPath}\n    path: ${taskPath}\n    output: ${outputDir}\n    types: ${typesDir}\n`
      )
    })

    it('generates types and build artifacts for task from config', async () => {
      const expectedInputs = {
        firstStaticNumber: 'uint32',
        secondStaticNumber: 'uint32',
        isTrue: 'bool',
      }

      const command = buildCommand()
      const { stdout, error } = await runCommand(command)

      expect(error).to.be.undefined
      expect(stdout).to.include('[test-task]')
      expect(stdout).to.include('Build complete!')

      // build artifacts
      expect(fs.existsSync(path.join(outputDir, 'task.wasm'))).to.be.true
      expect(fs.existsSync(path.join(outputDir, 'manifest.json'))).to.be.true

      // generated types
      expect(fs.existsSync(path.join(typesDir, 'index.ts'))).to.be.true
      expect(fs.existsSync(path.join(typesDir, 'ERC20.ts'))).to.be.true

      const manifestJson = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf-8'))
      expect(manifestJson.inputs).to.be.deep.equal(expectedInputs)
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
            itBuildsAndGeneratesTypes(manifestPath, expectedInputs)
          })

          context('when the manifest has inputs with descriptions', () => {
            const manifestWithDescriptions = `${basePath}/manifests/manifest-with-descriptions.yaml`
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
            itBuildsAndGeneratesTypes(manifestWithDescriptions, expectedInputs)
          })
        })

        context('when the task fails to compile', () => {
          const invalidTaskPath = `${basePath}/tasks/invalid-task.ts`
          const command = buildCommand(withCommonFlags(manifestPath, invalidTaskPath, outputDir, typesDir))

          itThrowsACliError(command, 'AssemblyScript compilation failed', 'CompilationError', 2)
        })

        context('when the types output directory already exists', () => {
          beforeEach('pre-create types directory with a file', () => {
            if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true })
            fs.writeFileSync(path.join(typesDir, 'randomFile.txt'), 'a')
          })

          it('generates types without requiring clean', async () => {
            const command = buildCommand(withCommonFlags(manifestPath, taskPath, outputDir, typesDir))
            const { error } = await runCommand(command)

            expect(error).to.be.undefined
            expect(fs.existsSync(path.join(typesDir, 'index.ts'))).to.be.true
            expect(fs.existsSync(path.join(typesDir, 'ERC20.ts'))).to.be.true
          })
        })
      })

      context('when the manifest is not valid', () => {
        context('when the manifest has invalid fields', () => {
          const invalidManifest = `${basePath}/manifests/invalid-manifest.yaml`
          const command = buildCommand(withCommonFlags(invalidManifest, taskPath, outputDir, typesDir))

          itThrowsACliError(command, 'More than one entry', 'ManifestValidationError', 1)
        })

        context('when the manifest has repeated fields', () => {
          const invalidManifest = `${basePath}/manifests/invalid-manifest-repeated.yaml`
          const command = buildCommand(withCommonFlags(invalidManifest, taskPath, outputDir, typesDir))

          itThrowsACliError(command, 'Duplicate Entry', 'ManifestValidationError', 1)
        })

        context('when the manifest is incomplete', () => {
          const invalidManifest = `${basePath}/manifests/incomplete-manifest.yaml`
          const command = buildCommand(withCommonFlags(invalidManifest, taskPath, outputDir, typesDir))

          itThrowsACliError(command, 'Missing/Incorrect Fields', 'ManifestValidationError', 3)
        })

        context('when the manifest is empty', () => {
          const invalidManifest = `${basePath}/manifests/empty-manifest.yaml`
          const command = buildCommand(withCommonFlags(invalidManifest, taskPath, outputDir, typesDir))

          itThrowsACliError(command, 'Empty Manifest', 'ManifestValidationError', 1)
        })
      })
    })

    context('when the manifest does not exist', () => {
      const inexistentManifest = `${manifestPath}-none`
      const command = buildCommand(withCommonFlags(inexistentManifest, taskPath, outputDir, typesDir))

      itThrowsACliError(command, `File not found: ${inexistentManifest}`, 'FileNotFound', 1)
    })
  })
})
