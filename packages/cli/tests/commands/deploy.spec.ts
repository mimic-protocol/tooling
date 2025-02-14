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
          ;['inputs.json', 'manifest.json', 'task.wasm'].map(createFile)
        })

        beforeEach('create axios mock', () => {
          axiosMock = new MockAdapter(axios)
        })

        afterEach('restore axios mock', () => {
          axiosMock.restore()
        })

        context('when uploading to IPFS is successful', () => {
          const CID = '123'
          beforeEach('mock submit response', () => {
            axiosMock.onPost(/.*\/submit/gm).reply(200, { CID })
          })

          context('when registering on registry is successful', () => {
            beforeEach('mock submit response', () => {
              axiosMock.onPost(/.*\/register\/.+/gm).reply(200)
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

          context('when registering on registry is not successful', () => {
            context('when there is an auth failure', () => {
              beforeEach('mock submit response', () => {
                axiosMock.onPost(/.*\/register\/.+/gm).reply(401)
              })

              it('saves the CID on a file and throws an error', async () => {
                const { error } = await runCommand(command)
                expect(error?.message).to.be.equal('Failed to upload to registry')
                expect(error?.code).to.be.equal('Unauthorized')
                expect(error?.suggestions?.length).to.be.equal(1)
                const json = JSON.parse(fs.readFileSync(`${outputDir}/CID.json`, 'utf-8'))
                expect(json.CID).to.be.equal(CID)
              })
            })

            context('when there is a generic failure', () => {
              beforeEach('mock submit response', () => {
                axiosMock.onPost(/.*\/register\/.+/gm).reply(501)
              })

              it('saves the CID on a file and throws an error', async () => {
                const { error } = await runCommand(command)
                expect(error?.message).to.be.equal('Failed to upload to registry - Request failed with status code 501')
                expect(error?.code).to.be.equal('501Error')
                expect(error?.suggestions?.length).to.be.equal(1)
                const json = JSON.parse(fs.readFileSync(`${outputDir}/CID.json`, 'utf-8'))
                expect(json.CID).to.be.equal(CID)
              })
            })
          })
        })

        context('when uploading to IPFS is not successful', () => {
          context('when there is an auth failure', () => {
            beforeEach('mock response', () => {
              axiosMock.onPost(/.*/).reply(401)
            })

            itThrowsACliError(command, 'Failed to upload to IPFS', 'Unauthorized', 1)
          })

          context('when there is a generic error', () => {
            beforeEach('mock response', () => {
              axiosMock.onPost(/.*/).reply(501)
            })

            itThrowsACliError(command, 'Failed to upload to IPFS - Request failed with status code 501', '501Error', 1)
          })
        })
      })

      context('when the directory does not contain the necessary files', () => {
        context('when the directory contains no files', () => {
          itThrowsACliError(command, `Could not find ${inputDir}/inputs.json`, 'FileNotFound', 1)
        })

        context('when the directory contains only one file', () => {
          beforeEach('create file', () => {
            createFile('inputs.json')
          })

          itThrowsACliError(command, `Could not find ${inputDir}/manifest.json`, 'FileNotFound', 1)
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
