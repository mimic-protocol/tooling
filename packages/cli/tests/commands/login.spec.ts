import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'

import { CredentialsManager } from '../../src/lib/CredentialsManager'
import { backupCredentials, restoreCredentials } from '../helpers'

describe('login', () => {
  let credentialsManager: CredentialsManager
  let backupDir: string | null = null

  beforeEach('backup existing credentials', () => {
    credentialsManager = CredentialsManager.getDefault()
    backupDir = backupCredentials(credentialsManager)
  })

  afterEach('Restore credentials and stubs', () => {
    restoreCredentials(credentialsManager, backupDir)
    backupDir = null
  })

  context('when no credentials exist', () => {
    it('should create .mimic directory if it does not exist', async () => {
      expect(fs.existsSync(credentialsManager.getBaseDir())).to.be.false

      await runCommand(['login', '--api-key', 'test-key'])

      expect(fs.existsSync(credentialsManager.getBaseDir())).to.be.true
    })

    it('should create multiple profiles', async () => {
      await runCommand(['login', '--api-key', 'default-key'])
      await runCommand(['login', '--profile', 'staging', '--api-key', 'staging-key'])
      await runCommand(['login', '--profile', 'production', '--api-key', 'prod-key'])

      const credentials = credentialsManager.readCredentials()
      expect(credentials).to.have.all.keys('default', 'staging', 'production')
      expect(credentials.default.apiKey).to.equal('default-key')
      expect(credentials.staging.apiKey).to.equal('staging-key')
      expect(credentials.production.apiKey).to.equal('prod-key')
    })
  })

  context('when credentials exist', () => {
    beforeEach('create credentials', () => {
      credentialsManager.saveProfile('default', 'old-key')
      credentialsManager.saveProfile('staging', 'old-key')
    })

    it('should update default profile when force-login is used', async () => {
      await runCommand(['login', '--api-key', 'new-key', '--force-login'])
      const newCredentials = credentialsManager.readCredentials()
      expect(newCredentials.default.apiKey).to.equal('new-key')
    })

    it('should update the specified profile when force-login is used', async () => {
      await runCommand(['login', '--profile', 'staging', '--api-key', 'new-key', '--force-login'])
      const newCredentials = credentialsManager.readCredentials()
      expect(newCredentials.staging.apiKey).to.equal('new-key')
    })
  })
})
