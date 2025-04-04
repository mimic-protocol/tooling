import { runCommand } from '@oclif/test'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { expect } from 'chai'
import * as fs from 'fs'
import { join } from 'path'

import { itThrowsACliError } from '../helpers'

describe('deploy', () => {
  const inputDir = join(__dirname, 'deploy-directory')
  let outputDir = inputDir

  context('when passing a deployment key', () => {
    const key = '123'
    const command = ['deploy', `-i ${inputDir}`, `-o ${outputDir}`, `--key ${key}`]

    context('when input directory exists', () => {
      beforeEach('create input directory', () => {
        fs.mkdirSync(inputDir, { recursive: true })
      })

      afterEach('delete generated files', () => {
        if (fs.existsSync(inputDir)) fs.rmSync(inputDir, { recursive: true })
      })

      const createFile = (name: string) => {
        fs.writeFileSync(`${inputDir}/${name}`, '')
      }

      context('when the directory contains necessary files', () => {
        let axiosMock: MockAdapter

        beforeEach('create files', () => {
          ;['manifest.json', 'task.wasm'].map(createFile)
        })

        beforeEach('create axios mock', () => {
          axiosMock = new MockAdapter(axios)
        })

        afterEach('restore axios mock', () => {
          axiosMock.restore()
        })

        context('when uploading to registry is successful', () => {
          const CID = '123'

          beforeEach('mock registry response', () => {
            axiosMock.onPost(/.*\/tasks/gm).reply(200, { CID })
          })

          context('when output directory exists', () => {
            it('saves the CID on a file', async () => {
              await runCommand(command)
              const json = JSON.parse(fs.readFileSync(`${outputDir}/CID.json`, 'utf-8'))
              expect(json.CID).to.be.equal(CID)
            })
          })

          context('when output directory does not exist', () => {
            const noOutDir = `${outputDir}/does-not-exist`
            const noOutDirCommand = ['deploy', `-i ${inputDir}`, `-o ${noOutDir}`, `--key ${key}`]

            it('saves the CID on a file', async () => {
              await runCommand(noOutDirCommand)
              const json = JSON.parse(fs.readFileSync(`${noOutDir}/CID.json`, 'utf-8'))
              expect(json.CID).to.be.equal(CID)
            })
          })
        })

        context('when uploading to registry is partially successful', () => {
          context('when there is a partial error', () => {
            const CID = '123'

            beforeEach('mock response', () => {
              axiosMock.onPost(/.*\/tasks/gm).reply(200, { CID, errorMessage: `Failed to register task: ${CID}` })
            })

            itThrowsACliError(command, `Failed to upload to registry`, 'RegistrationError', 1)
          })
        })

        context('when uploading to registry is not successful', () => {
          context('when there is an auth failure', () => {
            beforeEach('mock response', () => {
              axiosMock.onPost(/.*/).reply(401)
            })

            itThrowsACliError(command, 'Failed to upload to registry', 'Unauthorized', 1)
          })

          context('when there is a generic error', () => {
            beforeEach('mock response', () => {
              axiosMock.onPost(/.*/).reply(501)
            })

            itThrowsACliError(
              command,
              'Failed to upload to registry - Request failed with status code 501',
              '501Error',
              1
            )
          })
        })
      })

      context('when the directory does not contain the necessary files', () => {
        context('when the directory contains no files', () => {
          itThrowsACliError(command, `Could not find ${inputDir}/manifest.json`, 'FileNotFound', 1)
        })

        context('when the directory contains only one file', () => {
          beforeEach('create file', () => {
            createFile('manifest.json')
          })

          itThrowsACliError(command, `Could not find ${inputDir}/task.wasm`, 'FileNotFound', 1)
        })
      })
    })

    context('when input directory does not exist', () => {
      itThrowsACliError(command, `Directory ${inputDir} does not exist`, 'DirectoryNotFound', 1)
    })
  })

  context('when not passing a deployment key', () => {
    const command = ['deploy']

    itThrowsACliError(command, 'Missing required flag key')
  })
})
