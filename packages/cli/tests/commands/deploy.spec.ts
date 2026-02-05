import { runCommand } from '@oclif/test'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { expect } from 'chai'
import * as fs from 'fs'
import { join } from 'path'

import { CredentialsManager } from '../../src/lib/CredentialsManager'
import { backupCredentials, itThrowsACliError, restoreCredentials } from '../helpers'

describe('deploy', () => {
  const buildDir = join(__dirname, 'deploy-directory')

  context('when the default profile exists', () => {
    let credentialsManager: CredentialsManager
    let backupDir: string | null = null

    beforeEach('backup existing credentials', () => {
      credentialsManager = CredentialsManager.getDefault()
      backupDir = backupCredentials(credentialsManager)
    })

    afterEach('restore credentials and stubs', () => {
      restoreCredentials(credentialsManager, backupDir)
      backupDir = null
    })

    const defaultKey = '123'
    beforeEach('create default profile', () => {
      credentialsManager.saveProfile('default', defaultKey)
    })

    context('when uploading to registry is successful', () => {
      const CID = '123'
      let axiosMock: MockAdapter

      beforeEach('create axios mock', () => {
        axiosMock = new MockAdapter(axios)
      })

      afterEach('restore axios mock', () => {
        axiosMock.restore()
      })

      beforeEach('mock registry response', () => {
        axiosMock.onPost(/.*\/functions/gm).reply(200, { CID })
      })

      context('when build directory exists', () => {
        const command = ['deploy', `-b ${buildDir}`, '--skip-build']

        beforeEach('create build directory', () => {
          fs.mkdirSync(buildDir, { recursive: true })
        })

        afterEach('delete generated files', () => {
          if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true })
        })

        const createFile = (name: string) => {
          fs.writeFileSync(`${buildDir}/${name}`, '')
        }

        context('when the directory contains necessary files', () => {
          beforeEach('create files', () => {
            ;['manifest.json', 'function.wasm'].map(createFile)
          })

          context('when the api key is provided', () => {
            const apiKey = '456'
            const apiKeyCommand = [...command, '--api-key', apiKey]

            it('deploys successfully with the api key', async () => {
              await runCommand(apiKeyCommand)

              const requests = axiosMock.history.post
              expect(requests).to.have.lengthOf(1)
              expect(requests[0].headers?.['x-api-key']).to.equal(apiKey)
            })
          })

          context('when a profile is provided', () => {
            const apiKey = '789'
            const profile = 'custom-profile'
            const profileCommand = [...command, '--profile', profile]

            beforeEach('create profile', () => {
              credentialsManager.saveProfile(profile, apiKey)
            })

            it('deploys successfully with the custom profile', async () => {
              await runCommand(profileCommand)

              const requests = axiosMock.history.post
              expect(requests).to.have.lengthOf(1)
              expect(requests[0].headers?.['x-api-key']).to.equal(apiKey)
            })
          })

          it('saves the CID on a file', async () => {
            await runCommand(command)
            const json = JSON.parse(fs.readFileSync(`${buildDir}/CID.json`, 'utf-8'))
            expect(json.CID).to.be.equal(CID)
          })
        })

        context('when the directory does not contain the necessary files', () => {
          context('when the directory contains no files', () => {
            itThrowsACliError(command, `Could not find ${buildDir}/manifest.json`, 'File Not Found', 1)
          })

          context('when the directory contains only one file', () => {
            beforeEach('create file', () => {
              createFile('manifest.json')
            })

            itThrowsACliError(command, `Could not find ${buildDir}/function.wasm`, 'File Not Found', 1)
          })
        })
      })

      context('when build directory does not exist', () => {
        context('when the build is skipped', () => {
          const command = ['deploy', `-b ${buildDir}`, '--skip-build']

          itThrowsACliError(command, `Directory ${buildDir} does not exist`, 'Directory Not Found', 1)
        })
      })
    })

    context('when uploading to registry is not successful', () => {
      const command = ['deploy', `-b ${buildDir}`, '--skip-build']
      let axiosMock: MockAdapter

      beforeEach('create build directory', () => {
        fs.mkdirSync(buildDir, { recursive: true })
      })

      afterEach('delete generated files', () => {
        if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true })
      })

      const createFile = (name: string) => {
        fs.writeFileSync(`${buildDir}/${name}`, '')
      }

      beforeEach('create files', () => {
        ;['manifest.json', 'function.wasm'].map(createFile)
      })

      beforeEach('create axios mock', () => {
        axiosMock = new MockAdapter(axios)
      })

      afterEach('restore axios mock', () => {
        axiosMock.restore()
      })

      context('when there is a bad request failure', () => {
        context('when the error message is present', () => {
          const message = 'Function with same name and version already exists'

          beforeEach('mock response', () => {
            axiosMock.onPost(/.*\/functions/gm).reply(400, { content: { message } })
          })

          itThrowsACliError(command, message, 'Bad Request', 1)
        })

        context('when the error message is not present', () => {
          beforeEach('mock response', () => {
            axiosMock.onPost(/.*\/functions/gm).reply(400, { content: { errors: ['some error'] } })
          })

          itThrowsACliError(command, 'Failed to upload to registry', 'Bad Request', 1)
        })
      })

      context('when there is an authorization failure', () => {
        beforeEach('mock response', () => {
          axiosMock.onPost(/.*/).reply(401)
        })

        itThrowsACliError(command, 'Failed to upload to registry', 'Unauthorized', 1)
      })

      context('when there is an authentication failure', () => {
        beforeEach('mock response', () => {
          axiosMock.onPost(/.*/).reply(403)
        })

        itThrowsACliError(command, 'Failed to upload to registry', 'Invalid api key', 1)
      })

      context('when there is a generic error', () => {
        beforeEach('mock response', () => {
          axiosMock.onPost(/.*/).reply(501)
        })

        itThrowsACliError(command, 'Failed to upload to registry - Request failed with status code 501', '501 Error', 1)
      })
    })
  })

  context("when the default profile doesn't exist", () => {
    const command = ['deploy']

    itThrowsACliError(command, 'Authentication required', 'AuthenticationRequired', 3)
  })
})
