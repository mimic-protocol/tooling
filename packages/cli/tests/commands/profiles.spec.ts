import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { CredentialsManager } from '../../src/lib/CredentialsManager'

describe('profiles', () => {
  let credentialsManager: CredentialsManager
  let backupDir: string | null = null

  beforeEach('Backup existing credentials', () => {
    credentialsManager = CredentialsManager.getDefault()
    const credDir = credentialsManager.getBaseDir()

    // Backup existing credentials if they exist
    // We can stub CredentialsManager because runCommands runs in a separate context
    // and will not use the stubbed version
    if (fs.existsSync(credDir)) {
      backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mimic-backup-'))
      fs.cpSync(credDir, backupDir, { recursive: true })
      fs.rmSync(credDir, { recursive: true, force: true })
    }
  })

  afterEach('Restore credentials and stubs', () => {
    const credDir = credentialsManager.getBaseDir()
    if (fs.existsSync(credDir)) {
      fs.rmSync(credDir, { recursive: true, force: true })
    }

    if (backupDir && fs.existsSync(backupDir)) {
      fs.cpSync(backupDir, credDir, { recursive: true })
      fs.rmSync(backupDir, { recursive: true, force: true })
      backupDir = null
    }
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
