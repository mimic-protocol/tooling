import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'

describe('compile', () => {
  const basePath = `${__dirname}/../fixtures`
  const taskPath = `${basePath}/task.ts`
  const manifestPath = `${basePath}/manifest.yaml`
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
            `--task ${basePath}/invalid-task.ts`,
            `--manifest ${manifestPath}`,
            `--output ${outputDir}`,
          ])

          expect(error?.message).to.be.equal('AssemblyScript compilation failed')
          expect(error?.code).to.be.equal('BuildError')
          expect(error?.suggestions?.length).to.be.gt(0)
        })
      })
    })

    context('when the manifest is not valid', () => {
      // skipped because there is no implementation yet
      it.skip('throws an error', async () => {
        const { error } = await runCommand([
          'compile',
          `--task ${taskPath}`,
          `--manifest ${basePath}/invalid-manifest.yaml`,
          `--output ${outputDir}`,
        ])

        expect(error?.message).to.be.equal('Invalid Manifest')
        expect(error?.code).to.be.equal('InvalidManifest')
        expect(error?.suggestions?.length).to.be.gt(0)
      })
    })
  })

  context('when the manifest does not exist', () => {
    it('throws an error', async () => {
      const { error } = await runCommand([
        'compile',
        `--task ${taskPath}`,
        `--manifest ${manifestPath}-no`,
        `--output ${outputDir}`,
      ])

      expect(error?.message).to.be.equal('Could not find manifest.yaml')
      expect(error?.code).to.be.equal('FileNotFound')
      expect(error?.suggestions?.length).to.be.gt(0)
    })
  })
})
