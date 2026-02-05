import { Command } from '@oclif/core'
import { expect } from 'chai'
import * as fs from 'fs'

import Authenticate from '../../src/commands/authenticate'
import { CredentialsManager } from '../../src/lib/CredentialsManager'
import { backupCredentials, restoreCredentials } from '../helpers'

const DEFAULT_PROFILE = 'default'

describe('authenticate', () => {
  let credentialsManager: CredentialsManager
  let backupDir: string | null = null
  let mockCommand: Command

  beforeEach('backup existing credentials and setup mock command', () => {
    credentialsManager = CredentialsManager.getDefault()
    backupDir = backupCredentials(credentialsManager)
    mockCommand = new Command([], {})
  })

  afterEach('restore credentials', () => {
    restoreCredentials(credentialsManager, backupDir)
    backupDir = null
  })

  context('when api-key is not provided', () => {
    context('when credentials exist', () => {
      beforeEach('create credentials', () => {
        credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key-123')
      })

      context('when no profile is specified', () => {
        it('returns the default profile', () => {
          const credentials = Authenticate.authenticate(mockCommand, {})

          expect(credentials.apiKey).to.equal('test-key-123')
        })
      })

      context('when profile is specified', () => {
        context("when profile doesn't exists", () => {
          it('throws an error', () => {
            expect(() => Authenticate.authenticate(mockCommand, { profile: 'nonexistent' })).to.throw(
              "Profile 'nonexistent' not found"
            )
          })
        })

        context('when profile exists', () => {
          it('returns the profile', () => {
            const credentials = Authenticate.authenticate(mockCommand, { profile: DEFAULT_PROFILE })
            expect(credentials).to.deep.equal({ apiKey: 'test-key-123' })
          })
        })
      })
    })

    context('when no credentials exist', () => {
      context('when no folder', () => {
        beforeEach('remove folder', () => {
          const credDir = credentialsManager.getBaseDir()
          if (fs.existsSync(credDir)) {
            fs.rmSync(credDir, { recursive: true, force: true })
          }
        })
        it('throws an error', () => {
          expect(() => Authenticate.authenticate(mockCommand, { profile: DEFAULT_PROFILE })).to.throw(
            /No credentials directory found/
          )
        })
      })

      context('when folder exists', () => {
        beforeEach('create folder', () => {
          credentialsManager.createCredentialsDirIfNotExists()
        })
        it('throws an error', () => {
          expect(() => Authenticate.authenticate(mockCommand, { profile: DEFAULT_PROFILE })).to.throw(
            /No credentials file found/
          )
        })
      })
    })
  })

  context('when api-key flag is provided', () => {
    it('returns the api key', () => {
      const credentials = Authenticate.authenticate(mockCommand, { 'api-key': 'direct-key-123' })

      expect(credentials).to.deep.equal({ apiKey: 'direct-key-123' })
    })

    context('when profile flag is also provided', () => {
      it('returns the api key', () => {
        credentialsManager.saveProfile(DEFAULT_PROFILE, 'profile-key')

        const credentials = Authenticate.authenticate(mockCommand, {
          profile: DEFAULT_PROFILE,
          'api-key': 'flag-key',
        })

        expect(credentials).to.deep.equal({ apiKey: 'flag-key' })
      })
    })
  })
})
