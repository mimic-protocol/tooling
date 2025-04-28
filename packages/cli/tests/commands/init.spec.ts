import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import { join } from 'path'

describe('init', () => {
  const commandPath = join(__dirname, 'new-project')

  afterEach('delete generated files', () => {
    if (fs.existsSync(commandPath)) fs.rmSync(commandPath, { recursive: true })
  })

  context('when force flag is not passed', () => {
    const command = ['init', `--directory ${commandPath}`, '-y']

    context('when the directory does not exist', () => {
      it('creates the correct files', async () => {
        const { stdout, error } = await runCommand(command)
        expect(error).to.be.undefined
        expect(stdout).to.include('New project initialized!')
        expect(fs.existsSync(`${commandPath}/src/task.ts`)).to.be.true
        expect(fs.existsSync(`${commandPath}/manifest.yaml`)).to.be.true
      })
    })

    context('when the directory exists', () => {
      beforeEach('create directory', () => {
        fs.mkdirSync(commandPath)
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
    let userResponse
    const command = ['init', `--directory ${commandPath}`, '--force', '-y']

    context('when the user accepts the confirmation', () => {
      beforeEach('stub user input', () => {
        userResponse = 'Y'
      })

      context('when the directory exists', () => {
        beforeEach('create directory', () => {
          fs.mkdirSync(commandPath)
        })

        it("deletes the folder and it's contents", async () => {
          const { stdout, status } = runCommandWithUserInput(command, userResponse)
          expect(status).to.be.equal(0)
          expect(stdout).to.include('New project initialized!')
          expect(fs.existsSync(`${commandPath}/src/task.ts`)).to.be.true
          expect(fs.existsSync(`${commandPath}/manifest.yaml`)).to.be.true
        })
      })

      context('when the directory does not exist', () => {
        it("deletes the folder and it's contents", async () => {
          const { stdout, status } = runCommandWithUserInput(command, userResponse)
          expect(status).to.be.equal(0)
          expect(stdout).to.include('New project initialized!')
          expect(fs.existsSync(`${commandPath}/src/task.ts`)).to.be.true
          expect(fs.existsSync(`${commandPath}/manifest.yaml`)).to.be.true
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
        expect(stdout).to.include('You can remove the --force flag from your command')
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
