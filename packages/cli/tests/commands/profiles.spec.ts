import { runCommand } from '@oclif/test'
import { expect } from 'chai'

import { CredentialsManager } from '../../src/lib/CredentialsManager'
import { backupCredentials, restoreCredentials } from '../helpers'

describe('profiles', () => {
  let credentialsManager: CredentialsManager
  let backupDir: string | null = null

  beforeEach('Backup existing credentials', () => {
    credentialsManager = CredentialsManager.getDefault()
    backupDir = backupCredentials(credentialsManager)
  })

  afterEach('Restore credentials and stubs', () => {
    restoreCredentials(credentialsManager, backupDir)
    backupDir = null
  })

  it('should show message when no profiles exist', async () => {
    const { stdout } = await runCommand(['profiles'])

    expect(stdout).to.include('No profiles found')
    expect(stdout).to.include('mimic login')
  })

  it('should list single profile', async () => {
    credentialsManager.saveProfile('default', 'test-key')

    const { stdout } = await runCommand(['profiles'])

    expect(stdout).to.include('default')
    expect(stdout).to.include('(default)')
  })

  it('should list multiple profiles', async () => {
    credentialsManager.saveProfile('default', 'default-key')
    credentialsManager.saveProfile('staging', 'staging-key')
    credentialsManager.saveProfile('production', 'prod-key')

    const { stdout } = await runCommand(['profiles'])

    expect(stdout).to.include('default')
    expect(stdout).to.include('staging')
    expect(stdout).to.include('production')
  })
})
