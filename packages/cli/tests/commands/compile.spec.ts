import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

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
          expect(fs.existsSync(`${outputDir}/inputs.json`)).to.be.true
          expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

          const inputs = JSON.parse(fs.readFileSync(`${outputDir}/inputs.json`, 'utf-8'))
          const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))

          expect(inputs).to.be.deep.equal(['getValue', 'createIntent'])
          expect(manifest.inputs).to.be.deep.equal({ firstStaticNumber: 2, secondStaticNumber: 3 })
        })
      })

      context('when the task fails to compile', () => {
        it('throws an error', async () => {
          const { error } = await runCommand([
            'compile',
            `--task ${basePath}/tasks/invalid-task.ts`,
            `--manifest ${manifestPath}`,
            `--output ${outputDir}`,
          ])

          expect(error?.message).to.be.equal('AssemblyScript compilation failed')
          expect(error?.code).to.be.equal('BuildError')
          expect(error?.suggestions?.length).to.be.eq(1)
        })
      })
    })

    context('when the manifest is not valid', () => {
      context('when the manfiest has invalid fields', () => {
        it('throws an error', async () => {
          const { error } = await runCommand([
            'compile',
            `--task ${taskPath}`,
            `--manifest ${basePath}/manifests/invalid-manifest.yaml`,
            `--output ${outputDir}`,
          ])
          expect(error?.message).to.be.equal('More than one entry')
          expect(error?.code).to.be.equal('MoreThanOneEntryError')
          expect(error?.suggestions?.length).to.be.eq(1)
        })
      })

      context('when the manfiest has repeated fields', () => {
        it('throws an error', async () => {
          const { error } = await runCommand([
            'compile',
            `--task ${taskPath}`,
            `--manifest ${basePath}/manifests/invalid-manifest-repeated.yaml`,
            `--output ${outputDir}`,
          ])
          expect(error?.message).to.be.equal('Duplicate Entry')
          expect(error?.code).to.be.equal('DuplicateEntryError')
          expect(error?.suggestions?.length).to.be.eq(1)
        })
      })

      context('when the manifest is incomplete', () => {
        it('throws an error', async () => {
          const { error } = await runCommand([
            'compile',
            `--task ${taskPath}`,
            `--manifest ${basePath}/manifests/incomplete-manifest.yaml`,
            `--output ${outputDir}`,
          ])
          expect(error?.message).to.be.equal('Missing/Incorrect Fields')
          expect(error?.code).to.be.equal('FieldsError')
          expect(error?.suggestions?.length).to.be.eq(3)
        })
      })

      context('when the manifest is empty', () => {
        it('throws an error', async () => {
          const { error } = await runCommand([
            'compile',
            `--task ${taskPath}`,
            `--manifest ${basePath}/manifests/empty-manifest.yaml`,
            `--output ${outputDir}`,
          ])
          expect(error?.message).to.be.equal('Empty Manifest')
          expect(error?.code).to.be.equal('EmptyManifestError')
          expect(error?.suggestions?.length).to.be.eq(1)
        })
      })
    })
  })

  context('when the manifest does not exist', () => {
    let inexistentManifestPath = `${manifestPath}-none`

    it('throws an error', async () => {
      const { error } = await runCommand([
        'compile',
        `--task ${taskPath}`,
        `--manifest ${inexistentManifestPath}`,
        `--output ${outputDir}`,
      ])

      expect(error?.message).to.be.equal(`Could not find ${inexistentManifestPath}`)
      expect(error?.code).to.be.equal('FileNotFound')
      expect(error?.suggestions?.length).to.be.eq(1)
    })
  })

  context('when the output directory already exists', () => {
    beforeEach('create outputDirectory with files', () => {
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
      fs.writeFileSync(path.join(outputDir, 'inputs.json'), JSON.stringify({ a: 2 }, null, 2))
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
      expect(fs.existsSync(`${outputDir}/inputs.json`)).to.be.true
      expect(fs.existsSync(`${outputDir}/manifest.json`)).to.be.true

      const inputs = JSON.parse(fs.readFileSync(`${outputDir}/inputs.json`, 'utf-8'))
      const manifest = JSON.parse(fs.readFileSync(`${outputDir}/manifest.json`, 'utf-8'))

      expect(inputs).to.be.deep.equal(['getValue', 'createIntent'])
      expect(manifest.inputs).to.be.deep.equal({ firstStaticNumber: 2, secondStaticNumber: 3 })
    })
  })
})
