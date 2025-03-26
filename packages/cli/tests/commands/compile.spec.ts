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

  context('when the manifest exists', () => {
    context('when the manifest is valid', () => {
      context('when the task compiles successfully', () => {
        it('creates the files correctly', async () => {
          const { stdout, error } = await runCommand([
            'compile',
            `--task ${taskPath}`,
            `--manifest ${manifestPath}`,
            `--output ${outputDir}`,
          ])

          expect(error).to.be.undefined
          expect(stdout).to.include('Build complete!')

          expect(fs.existsSync(`${outputDir}/task.wasm`)).to.be.true
          expect(fs.existsSync(`${outputDir}/task.wat`)).to.be.true
          expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

          const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))

          expect(manifest.inputs).to.be.deep.equal({ firstStaticNumber: 2, secondStaticNumber: 3 })
        })
      })

      context('when the task fails to compile', () => {
        const command = [
          'compile',
          `--task ${basePath}/tasks/invalid-task.ts`,
          `--manifest ${manifestPath}`,
          `--output ${outputDir}`,
        ]

        itThrowsACliError(command, 'AssemblyScript compilation failed', 'BuildError', 1)
      })
    })

    context('when the manifest is not valid', () => {
      context('when the manfiest has invalid fields', () => {
        const command = [
          'compile',
          `--task ${taskPath}`,
          `--manifest ${basePath}/manifests/invalid-manifest.yaml`,
          `--output ${outputDir}`,
        ]

        itThrowsACliError(command, 'More than one entry', 'MoreThanOneEntryError', 1)
      })

      context('when the manfiest has repeated fields', () => {
        const command = [
          'compile',
          `--task ${taskPath}`,
          `--manifest ${basePath}/manifests/invalid-manifest-repeated.yaml`,
          `--output ${outputDir}`,
        ]

        itThrowsACliError(command, 'Duplicate Entry', 'DuplicateEntryError', 1)
      })

      context('when the manifest is incomplete', () => {
        const command = [
          'compile',
          `--task ${taskPath}`,
          `--manifest ${basePath}/manifests/incomplete-manifest.yaml`,
          `--output ${outputDir}`,
        ]

        itThrowsACliError(command, 'Missing/Incorrect Fields', 'FieldsError', 3)
      })

      context('when the manifest is empty', () => {
        const command = [
          'compile',
          `--task ${taskPath}`,
          `--manifest ${basePath}/manifests/empty-manifest.yaml`,
          `--output ${outputDir}`,
        ]

        itThrowsACliError(command, 'Empty Manifest', 'EmptyManifestError', 1)
      })
    })
  })

  context('when the manifest does not exist', () => {
    let inexistentManifestPath = `${manifestPath}-none`
    const command = ['compile', `--task ${taskPath}`, `--manifest ${inexistentManifestPath}`, `--output ${outputDir}`]

    itThrowsACliError(command, `Could not find ${inexistentManifestPath}`, 'FileNotFound', 1)
  })

  context('when the output directory already exists', () => {
    beforeEach('create outputDirectory with files', () => {
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
      fs.writeFileSync(path.join(outputDir, 'randomFile.txt'), JSON.stringify({ a: 2 }, null, 2))
    })

    it('creates the files correctly', async () => {
      const { stdout, error } = await runCommand([
        'compile',
        `--task ${taskPath}`,
        `--manifest ${manifestPath}`,
        `--output ${outputDir}`,
      ])

      expect(error).to.be.undefined
      expect(stdout).to.include('Build complete!')

      expect(fs.existsSync(`${outputDir}/task.wasm`)).to.be.true
      expect(fs.existsSync(`${outputDir}/task.wat`)).to.be.true
      expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

      const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))

      expect(manifest.inputs).to.be.deep.equal({ firstStaticNumber: 2, secondStaticNumber: 3 })
    })
  })
})
