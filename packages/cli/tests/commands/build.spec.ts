import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import { itThrowsACliError } from '../helpers'

describe('build', () => {
  const basePath = `${__dirname}/../fixtures`
  const functionPath = `${basePath}/functions/function.ts`
  const manifestPath = `${basePath}/manifests/manifest.yaml`
  const buildDir = `${basePath}/output`
  const typesDir = `${basePath}/src/types`

  afterEach('cleanup generated files', () => {
    if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true })
    if (fs.existsSync(typesDir)) fs.rmSync(typesDir, { recursive: true })
  })

  const buildCommand = (args: string[] = []) => {
    return ['build', ...args]
  }

  const withCommonFlags = (
    manifest: string,
    functionPath: string,
    buildDirectory: string,
    typesDirectory: string,
    extra: string[] = []
  ) => {
    return [
      `--manifest ${manifest}`,
      `--function ${functionPath}`,
      `--build-directory ${buildDirectory}`,
      `--types-directory ${typesDirectory}`,
      ...extra,
    ]
  }

  const itBuildsAndGeneratesTypes = (manifest: string, expectedInputs: object) => {
    it('generates types and build artifacts', async () => {
      const command = buildCommand(withCommonFlags(manifest, functionPath, buildDir, typesDir))
      const { stdout, error } = await runCommand(command)

      expect(error).to.be.undefined
      expect(stdout).to.include('Build complete!')

      // build artifacts
      expect(fs.existsSync(path.join(buildDir, 'function.wasm'))).to.be.true
      expect(fs.existsSync(path.join(buildDir, 'manifest.json'))).to.be.true

      // generated types
      expect(fs.existsSync(path.join(typesDir, 'index.ts'))).to.be.true
      expect(fs.existsSync(path.join(typesDir, 'ERC20.ts'))).to.be.true

      const manifestJson = JSON.parse(fs.readFileSync(path.join(buildDir, 'manifest.json'), 'utf-8'))
      expect(manifestJson.inputs).to.be.deep.equal(expectedInputs)
    })
  }

  context('when the manifest exists', () => {
    context('when the manifest is valid', () => {
      context('when the function compiles successfully', () => {
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

      context('when the function fails to compile', () => {
        const invalidFunctionPath = `${basePath}/functions/invalid-function.ts`
        const command = buildCommand(withCommonFlags(manifestPath, invalidFunctionPath, buildDir, typesDir))

        itThrowsACliError(command, 'AssemblyScript compilation failed', 'BuildError', 1)
      })

      context('when the types output directory already exists', () => {
        beforeEach('pre-create types directory with a file', () => {
          if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true })
          fs.writeFileSync(path.join(typesDir, 'randomFile.txt'), 'a')
        })

        it('generates types without requiring clean', async () => {
          const command = buildCommand(withCommonFlags(manifestPath, functionPath, buildDir, typesDir))
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
        const command = buildCommand(withCommonFlags(invalidManifest, functionPath, buildDir, typesDir))

        itThrowsACliError(command, 'More than one entry', 'MoreThanOneEntryError', 1)
      })

      context('when the manifest has repeated fields', () => {
        const invalidManifest = `${basePath}/manifests/invalid-manifest-repeated.yaml`
        const command = buildCommand(withCommonFlags(invalidManifest, functionPath, buildDir, typesDir))

        itThrowsACliError(command, 'Duplicate Entry', 'DuplicateEntryError', 1)
      })

      context('when the manifest is incomplete', () => {
        const invalidManifest = `${basePath}/manifests/incomplete-manifest.yaml`
        const command = buildCommand(withCommonFlags(invalidManifest, functionPath, buildDir, typesDir))

        itThrowsACliError(command, 'Missing/Incorrect Fields', 'FieldsError', 3)
      })

      context('when the manifest is empty', () => {
        const invalidManifest = `${basePath}/manifests/empty-manifest.yaml`
        const command = buildCommand(withCommonFlags(invalidManifest, functionPath, buildDir, typesDir))

        itThrowsACliError(command, 'Empty Manifest', 'EmptyManifestError', 1)
      })
    })
  })

  context('when the manifest does not exist', () => {
    const inexistentManifest = `${manifestPath}-none`
    const command = buildCommand(withCommonFlags(inexistentManifest, functionPath, buildDir, typesDir))

    itThrowsACliError(command, `Could not find ${inexistentManifest}`, 'FileNotFound', 1)
  })
})
