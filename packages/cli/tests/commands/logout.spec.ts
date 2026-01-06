import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as sinon from 'sinon'

import { CredentialsManager } from '../../src/lib/CredentialsManager'
import { backupCredentials, restoreCredentials } from '../helpers'

describe('logout', () => {
  let credentialsManager: CredentialsManager
  let backupDir: string | null = null

  beforeEach('backup existing credentials', () => {
    credentialsManager = CredentialsManager.getDefault()
    backupDir = backupCredentials(credentialsManager)
  })

  afterEach('restore credentials and stubs', () => {
    sinon.restore()

    restoreCredentials(credentialsManager, backupDir)
    backupDir = null
  })

  describe('when credentials exist', () => {
    beforeEach(() => {
      credentialsManager.saveProfile('default', 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile('production', 'prod-key')
    })

    it('should remove default profile', async () => {
      const { stdout } = await runCommand(['logout', '--force'])

      expect(stdout).to.include('Credentials removed for profile default')
      expect(credentialsManager.profileExists('default')).to.be.false
      expect(credentialsManager.profileExists('staging')).to.be.true
      expect(credentialsManager.profileExists('production')).to.be.true
    })

    it('should remove specified profile', async () => {
      credentialsManager.saveProfile('staging', 'staging-key')

      const { stdout } = await runCommand(['logout', '--profile', 'staging', '--force'])

      expect(stdout).to.include('Credentials removed for profile staging')
      expect(credentialsManager.profileExists('default')).to.be.true
      expect(credentialsManager.profileExists('staging')).to.be.false
      expect(credentialsManager.profileExists('production')).to.be.true
    })
  })

  describe('when credentials do not exist', () => {
    it('should show error when profile does not exist', async () => {
      const { error } = await runCommand(['logout', '--profile', 'nonexistent'])

      expect(error?.message).to.include("Profile 'nonexistent' does not exist")
    })

    it('should throw an error when profile does not exist', async () => {
      credentialsManager.saveProfile('default', 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')

      const { error } = await runCommand(['logout', '--profile', 'nonexistent'])

      expect(error?.message).to.include("Profile 'nonexistent' does not exist")
    })
  })
})
