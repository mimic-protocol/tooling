import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import { spawnSync } from 'child_process'
import * as fs from 'fs'

import { itThrowsACliError } from '../helpers'

describe('codegen', () => {
  const basePath = `${__dirname}/../fixtures`
  const manifestPath = `${basePath}/manifests/manifest.yaml`
  const outputDir = `${basePath}/src/types`

  afterEach('delete generated files', () => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  context('when the manifest exists', () => {
    context('when clean flag is not passed', () => {
      const command = ['codegen', `--manifest ${manifestPath}`, `--output ${outputDir}`]

      context('when there are inputs and abis', () => {
        it('generates correctly', async () => {
          const { error } = await runCommand(command)
          expect(error).to.be.undefined
          expect(fs.existsSync(`${outputDir}/ERC20.ts`)).to.be.true
          expect(fs.existsSync(`${outputDir}/index.ts`)).to.be.true
        })
      })

      context('when there are no inputs or abis', () => {
        const command = ['codegen', `--manifest ${basePath}/manifests/simple-manifest.yaml`, `--output ${outputDir}`]

        it('generates nothing', async () => {
          const { error } = await runCommand(command)
          expect(error).to.be.undefined
          expect(fs.existsSync(`${outputDir}/ERC20.ts`)).to.be.false
          expect(fs.existsSync(`${outputDir}/ERC20.ts`)).to.be.false
          expect(fs.existsSync(`${outputDir}`)).to.be.false
        })
      })
    })
  })

  context('when the manifest does not exist', () => {
    const command = ['codegen', `--manifest ${manifestPath}fake`, `--output ${outputDir}`]

    itThrowsACliError(command, `Could not find ${manifestPath}fake`, 'FileNotFound', 1)
  })

  context('when clean flag is passed', () => {
    let userResponse
    const command = ['codegen', `--manifest ${manifestPath}`, `--output ${outputDir}`, '--clean']

    context('when the user accepts the confirmation', () => {
      beforeEach('stub user input', () => {
        userResponse = 'Y'
      })

      context('when the directory exists', () => {
        beforeEach('create directory', () => {
          fs.mkdirSync(outputDir, { recursive: true })
        })

        it("deletes the folder and it's contents", async () => {
          const { status } = runCommandWithUserInput(command, userResponse)
          expect(status).to.be.equal(0)
          expect(fs.existsSync(`${outputDir}/index.ts`)).to.be.true
          expect(fs.existsSync(`${outputDir}/ERC20.ts`)).to.be.true
        })
      })

      context('when the directory does not exist', () => {
        it("deletes the folder and it's contents", async () => {
          const { status } = runCommandWithUserInput(command, userResponse)
          expect(status).to.be.equal(0)
          expect(fs.existsSync(`${outputDir}/index.ts`)).to.be.true
          expect(fs.existsSync(`${outputDir}/ERC20.ts`)).to.be.true
        })
      })
    })

    context('when the user rejects the confirmation', () => {
      beforeEach('stub user input', () => {
        userResponse = 'N'
      })

      it('stops execution', async () => {
        const { stdout, status } = runCommandWithUserInput(command, userResponse)
        expect(status).to.be.equal(0)
        expect(stdout).to.include('You can remove the --clean flag from your command')
        expect(stdout).to.include('Stopping initialization...')
      })
    })
  })
})

const runCommandWithUserInput = (command: string[], userResponse: string) => {
  const parsedCommand = command.flatMap((c) => c.split(' '))
  return spawnSync('yarn', ['mimic', ...parsedCommand], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    input: `${userResponse}\n`,
  })
}
