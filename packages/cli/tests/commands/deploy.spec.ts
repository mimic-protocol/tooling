import { runCommand } from '@oclif/test'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { expect } from 'chai'
import * as fs from 'fs'
import { join } from 'path'

import { CredentialsManager } from '../../src/lib/CredentialsManager'
import { backupCredentials, itThrowsACliError, restoreCredentials } from '../helpers'

describe('deploy', () => {
  const inputDir = join(__dirname, 'deploy-directory')
  let outputDir = inputDir
  const mimicConfigPath = join(process.cwd(), 'mimic.yaml')
  const basePath = `${__dirname}/../fixtures`
  const manifestPath = `${basePath}/manifests/manifest.yaml`
  const taskPath = `${basePath}/tasks/task.ts`

  afterEach('cleanup mimic config', () => {
    if (fs.existsSync(mimicConfigPath)) fs.unlinkSync(mimicConfigPath)
  })

  context('when the mimic config exists', () => {
    let credentialsManager: CredentialsManager
    let backupDir: string | null = null
    let axiosMock: MockAdapter
    const defaultKey = '123'
    const CID = '456'

    beforeEach('create mimic.yaml', () => {
      fs.writeFileSync(
        mimicConfigPath,
        `tasks:\n  - name: test-task\n    manifest: ${manifestPath}\n    task: ${taskPath}\n    output: ${inputDir}\n`
      )
    })

    beforeEach('backup existing credentials', () => {
      credentialsManager = CredentialsManager.getDefault()
      backupDir = backupCredentials(credentialsManager)
    })

    beforeEach('create default profile', () => {
      credentialsManager.saveProfile('default', defaultKey)
    })

    beforeEach('create input directory with files', () => {
      fs.mkdirSync(inputDir, { recursive: true })
      fs.writeFileSync(`${inputDir}/manifest.json`, '')
      fs.writeFileSync(`${inputDir}/task.wasm`, '')
    })

    beforeEach('create axios mock', () => {
      axiosMock = new MockAdapter(axios)
      axiosMock.onPost(/.*\/tasks/gm).reply(200, { CID })
    })

    afterEach('cleanup', () => {
      axiosMock.restore()
      restoreCredentials(credentialsManager, backupDir)
      backupDir = null
      if (fs.existsSync(inputDir)) fs.rmSync(inputDir, { recursive: true })
    })

    it('deploys successfully using task from config', async () => {
      const deployCommand = ['deploy', '--skip-compile']
      await runCommand(deployCommand)

      const requests = axiosMock.history.post
      expect(requests).to.have.lengthOf(1)
      expect(requests[0].headers?.['x-api-key']).to.equal(defaultKey)
    })

    it('saves the CID on a file using task output from config', async () => {
      const deployCommand = ['deploy', '--skip-compile']
      await runCommand(deployCommand)
      const json = JSON.parse(fs.readFileSync(`${inputDir}/CID.json`, 'utf-8'))
      expect(json.CID).to.be.equal(CID)
    })
  })

  context('when the mimic config does not exist', () => {
    beforeEach('ensure mimic.yaml does not exist', () => {
      if (fs.existsSync(mimicConfigPath)) fs.unlinkSync(mimicConfigPath)
    })

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

      const command = ['deploy', `-i ${inputDir}`, `-o ${outputDir}`, '--skip-compile']

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
                const json = JSON.parse(fs.readFileSync(`${outputDir}/CID.json`, 'utf-8'))
                expect(json.CID).to.be.equal(CID)
              })
            })

            context('when output directory does not exist', () => {
              const noOutDir = `${outputDir}/does-not-exist`
              const noOutDirCommand = ['deploy', `-i ${inputDir}`, `-o ${noOutDir}`, '--skip-compile']

              it('saves the CID on a file', async () => {
                await runCommand(noOutDirCommand)
                const json = JSON.parse(fs.readFileSync(`${noOutDir}/CID.json`, 'utf-8'))
                expect(json.CID).to.be.equal(CID)
              })
            })
          })

          context('when uploading to registry is not successful', () => {
            context('when there is a bad request failure', () => {
              context('when the error message is present', () => {
                const message = 'Task with same name and version already exists'

                beforeEach('mock response', () => {
                  axiosMock.onPost(/.*\/tasks/gm).reply(400, { content: { message } })
                })

                itThrowsACliError(command, message, 'Deploy400Error', 1)
              })

              context('when the error message is not present', () => {
                beforeEach('mock response', () => {
                  axiosMock.onPost(/.*\/tasks/gm).reply(400, { content: { errors: ['some error'] } })
                })

                itThrowsACliError(command, 'Bad request', 'Deploy400Error', 1)
              })
            })

            context('when there is an authorization failure', () => {
              beforeEach('mock response', () => {
                axiosMock.onPost(/.*/).reply(401)
              })

              itThrowsACliError(command, 'Unauthorized', 'Deploy401Error', 1)
            })

            context('when there is an authentication failure', () => {
              beforeEach('mock response', () => {
                axiosMock.onPost(/.*/).reply(403)
              })

              itThrowsACliError(command, 'Invalid API key', 'Deploy403Error', 1)
            })

            context('when there is a generic error', () => {
              beforeEach('mock response', () => {
                axiosMock.onPost(/.*/).reply(501)
              })

              itThrowsACliError(command, 'Upload failed: Request failed with status code 501', 'Deploy501Error', 1)
            })
          })
        })

        context('when the directory does not contain the necessary files', () => {
          context('when the directory contains no files', () => {
            itThrowsACliError(command, `File not found: ${inputDir}/manifest.json`, 'FileNotFound', 1)
          })

          context('when the directory contains only one file', () => {
            beforeEach('create file', () => {
              createFile('manifest.json')
            })

            itThrowsACliError(command, `File not found: ${inputDir}/task.wasm`, 'FileNotFound', 1)
          })
        })
      })

      context('when input directory does not exist', () => {
        itThrowsACliError(command, `Directory not found: ${inputDir}`, 'DirectoryNotFound', 1)
      })
    })

    context("when the default profile doesn't exist", () => {
      const command = ['deploy']

      itThrowsACliError(command, 'Authentication required', 'AuthenticationRequired', 3)
    })
  })
})
