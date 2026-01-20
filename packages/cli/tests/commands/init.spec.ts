import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import { join } from 'path'

describe('init', () => {
  const commandPath = join(__dirname, 'new-project')

  afterEach('delete generated files', () => {
    if (fs.existsSync(commandPath)) fs.rmSync(commandPath, { recursive: true })
  })

  const assertStdoutAndInitializedFiles = (stdout: string) => {
    expect(stdout).to.include('New project initialized!')
    // TODO UPDATE WHEN INIT REPO IS UPDATED
    expect(fs.existsSync(`${commandPath}/src/task.ts`)).to.be.true
    expect(fs.existsSync(`${commandPath}/package.json`)).to.be.true
    expect(fs.existsSync(`${commandPath}/manifest.yaml`)).to.be.true
    expect(fs.existsSync(`${commandPath}/eslint.config.mjs`)).to.be.true
    expect(fs.existsSync(`${commandPath}/.gitignore`)).to.be.true
  }

  context('when force flag is not passed', () => {
    const command = ['init', commandPath]

    context('when the directory exists', () => {
      beforeEach('create directory', () => {
        fs.mkdirSync(commandPath)
        fs.writeFileSync(join(commandPath, 'file.txt'), '')
      })

      it('throws an error', async () => {
        const { error } = await runCommand(command)

        expect(error?.message).to.be.equal(`Directory ${commandPath} is not empty`)
        expect(error?.code).to.be.equal('DirectoryNotEmpty')
        expect(error?.suggestions?.length).to.be.eq(2)
      })
    })
  })

  context('when force flag is passed', () => {
    const command = ['init', commandPath, '--force']

    context('when the directory exists', () => {
      beforeEach('create directory', () => {
        fs.mkdirSync(commandPath)
        fs.writeFileSync(join(commandPath, 'file.txt'), 'test')
      })

      it('deletes the folder and its contents', async () => {
        const { stdout, error } = await runCommand(command)
        expect(error).to.be.undefined
        assertStdoutAndInitializedFiles(stdout)
      })
    })

    context('when the directory does not exist', () => {
      it('creates the project', async () => {
        const { stdout, error } = await runCommand(command)
        expect(error).to.be.undefined
        assertStdoutAndInitializedFiles(stdout)
      })
    })
  })
})
