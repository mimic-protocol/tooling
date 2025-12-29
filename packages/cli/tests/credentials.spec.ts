import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { CredentialsManager } from '../src/lib/CredentialsManager'

describe('credentials', () => {
  let tempDir: string
  let credentialsManager: CredentialsManager

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mimic-test-'))
    credentialsManager = new CredentialsManager(tempDir)
  })

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('getCredentialsDir', () => {
    it('should return the base directory', () => {
      const dir = credentialsManager.getBaseDir()
      expect(dir).to.equal(tempDir)
    })
  })

  describe('getCredentialsPath', () => {
    it('should return path to credentials file', () => {
      const credentialsPath = credentialsManager.getCredentialsPath()
      expect(credentialsPath).to.equal(path.join(tempDir, 'credentials'))
    })
  })

  describe('ensureCredentialsDir', () => {
    it('should create credentials directory if it does not exist', () => {
      // Remove directory first to ensure clean state
      const credDir = credentialsManager.getBaseDir()
      if (fs.existsSync(credDir)) {
        fs.rmSync(credDir, { recursive: true, force: true })
      }
      expect(fs.existsSync(credDir)).to.be.false

      credentialsManager.createCredentialsDirIfNotExists()

      expect(fs.existsSync(credDir)).to.be.true
      expect(fs.statSync(credDir).isDirectory()).to.be.true
    })

    it('should not fail if directory already exists', () => {
      const credDir = credentialsManager.getBaseDir()
      fs.mkdirSync(credDir, { recursive: true })

      expect(() => credentialsManager.createCredentialsDirIfNotExists()).to.not.throw()
    })
  })

  describe('parseCredentials', () => {
    it('should parse single profile correctly', () => {
      const content = '[default]\napi_key=test-key-123\n'
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        default: { apiKey: 'test-key-123' },
      })
    })

    it('should parse multiple profiles correctly', () => {
      const content = `
[default]
api_key=default-key

[staging]
api_key=staging-key

[production]
api_key=prod-key
`
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        default: { apiKey: 'default-key' },
        staging: { apiKey: 'staging-key' },
        production: { apiKey: 'prod-key' },
      })
    })

    it('should ignore comments and empty lines', () => {
      const content = `
# This is a comment
[default]
; This is also a comment
api_key=test-key

# Another comment
[staging]
api_key=staging-key
`
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        default: { apiKey: 'test-key' },
        staging: { apiKey: 'staging-key' },
      })
    })

    it('should handle keys with spaces around equals sign', () => {
      const content = '[default]\napi_key = test-key-123 \n'
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        default: { apiKey: 'test-key-123' },
      })
    })

    it('should return empty object for empty content', () => {
      const profiles = credentialsManager.parseCredentials('')
      expect(profiles).to.deep.equal({})
    })
  })

  describe('serializeCredentials', () => {
    it('should serialize single profile correctly', () => {
      const profiles = {
        default: { apiKey: 'test-key-123' },
      }
      const content = credentialsManager.serializeCredentials(profiles)

      expect(content).to.equal('[default]\napi_key=test-key-123\n')
    })

    it('should serialize multiple profiles correctly', () => {
      const profiles = {
        default: { apiKey: 'default-key' },
        staging: { apiKey: 'staging-key' },
      }
      const content = credentialsManager.serializeCredentials(profiles)

      expect(content).to.include('[default]\napi_key=default-key\n')
      expect(content).to.include('[staging]\napi_key=staging-key\n')
    })
  })

  describe('readCredentials', () => {
    it('should return empty object if credentials file does not exist', () => {
      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({})
    })

    it('should read and parse credentials file', () => {
      credentialsManager.createCredentialsDirIfNotExists()
      const credentialsPath = credentialsManager.getCredentialsPath()
      fs.writeFileSync(credentialsPath, '[default]\napi_key=test-key\n')

      const profiles = credentialsManager.readCredentials()

      expect(profiles).to.deep.equal({
        default: { apiKey: 'test-key' },
      })
    })
  })

  describe('writeCredentials', () => {
    it('should create credentials directory if it does not exist', () => {
      const credDir = credentialsManager.getBaseDir()
      if (fs.existsSync(credDir)) {
        fs.rmSync(credDir, { recursive: true, force: true })
      }
      expect(fs.existsSync(credDir)).to.be.false

      credentialsManager.writeCredentials({ default: { apiKey: 'test-key' } })

      expect(fs.existsSync(credDir)).to.be.true
    })

    it('should write credentials to file', () => {
      const profiles = {
        default: { apiKey: 'test-key' },
        staging: { apiKey: 'staging-key' },
      }

      credentialsManager.writeCredentials(profiles)

      const credentialsPath = credentialsManager.getCredentialsPath()
      expect(fs.existsSync(credentialsPath)).to.be.true

      const content = fs.readFileSync(credentialsPath, 'utf-8')
      expect(content).to.include('[default]')
      expect(content).to.include('api_key=test-key')
      expect(content).to.include('[staging]')
      expect(content).to.include('api_key=staging-key')
    })

    it('should set file permissions to 600 on Unix systems', function () {
      if (process.platform === 'win32') {
        this.skip()
        return
      }

      credentialsManager.writeCredentials({ default: { apiKey: 'test-key' } })

      const credentialsPath = credentialsManager.getCredentialsPath()
      const stats = fs.statSync(credentialsPath)
      const mode = stats.mode & 0o777

      expect(mode).to.equal(0o600)
    })
  })

  describe('saveProfile', () => {
    it('should save a new profile', () => {
      credentialsManager.saveProfile('default', 'test-key-123')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({
        default: { apiKey: 'test-key-123' },
      })
    })

    it('should update an existing profile', () => {
      credentialsManager.saveProfile('default', 'old-key')
      credentialsManager.saveProfile('default', 'new-key')

      const profiles = credentialsManager.readCredentials()
      expect(profiles.default.apiKey).to.equal('new-key')
    })

    it('should not affect other profiles when updating', () => {
      credentialsManager.saveProfile('default', 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile('default', 'updated-default-key')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({
        default: { apiKey: 'updated-default-key' },
        staging: { apiKey: 'staging-key' },
      })
    })
  })

  describe('getProfile', () => {
    it('should throw error if credentials directory does not exist', () => {
      const credDir = credentialsManager.getBaseDir()
      if (fs.existsSync(credDir)) {
        fs.rmSync(credDir, { recursive: true, force: true })
      }
      expect(() => credentialsManager.getProfile('default')).to.throw(/No credentials directory found/)
    })

    it('should throw error if credentials file does not exist', () => {
      credentialsManager.createCredentialsDirIfNotExists()
      expect(() => credentialsManager.getProfile('default')).to.throw(/No credentials file found/)
    })

    it('should throw error if profile does not exist', () => {
      credentialsManager.saveProfile('default', 'test-key')
      expect(() => credentialsManager.getProfile('nonexistent')).to.throw(/Profile 'nonexistent' not found/)
    })

    it('should include available profiles in error message', () => {
      credentialsManager.saveProfile('default', 'test-key')
      credentialsManager.saveProfile('staging', 'staging-key')

      try {
        credentialsManager.getProfile('nonexistent')
        expect.fail('Should have thrown an error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error.message).to.include('default')
        expect(error.message).to.include('staging')
      }
    })

    it('should throw error if api_key is empty', () => {
      credentialsManager.createCredentialsDirIfNotExists()
      const credentialsPath = credentialsManager.getCredentialsPath()
      fs.writeFileSync(credentialsPath, '[default]\napi_key=\n')

      expect(() => credentialsManager.getProfile('default')).to.throw(/has no API key/)
    })

    it('should return profile credentials if valid', () => {
      credentialsManager.saveProfile('default', 'test-key-123')

      const credentials = credentialsManager.getProfile('default')

      expect(credentials).to.deep.equal({ apiKey: 'test-key-123' })
    })

    it('should default to "default" profile if no name provided', () => {
      credentialsManager.saveProfile('default', 'default-key')

      const credentials = credentialsManager.getProfile()

      expect(credentials.apiKey).to.equal('default-key')
    })
  })

  describe('ensureLoggedIn', () => {
    it('should return credentials if profile exists', () => {
      credentialsManager.saveProfile('default', 'test-key')

      const credentials = credentialsManager.getCredentials('default')

      expect(credentials).to.deep.equal({ apiKey: 'test-key' })
    })

    it('should throw error with user-friendly message if not logged in', () => {
      expect(() => credentialsManager.getCredentials('default')).to.throw(/Authentication required/)
    })

    it('should default to "default" profile', () => {
      credentialsManager.saveProfile('default', 'test-key')

      const credentials = credentialsManager.getCredentials()

      expect(credentials.apiKey).to.equal('test-key')
    })
  })

  describe('listProfiles', () => {
    it('should return empty array if no profiles exist', () => {
      const profiles = credentialsManager.getProfiles()
      expect(profiles).to.deep.equal([])
    })

    it('should return list of profile names', () => {
      credentialsManager.saveProfile('default', 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile('production', 'prod-key')

      const profiles = credentialsManager.getProfiles()

      expect(profiles).to.have.members(['default', 'staging', 'production'])
    })
  })

  describe('removeProfile', () => {
    it('should throw error if profile does not exist', () => {
      expect(() => credentialsManager.removeProfile('nonexistent')).to.throw(/does not exist/)
    })

    it('should remove a profile', () => {
      credentialsManager.saveProfile('default', 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')

      credentialsManager.removeProfile('staging')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({
        default: { apiKey: 'default-key' },
      })
    })

    it('should not affect other profiles', () => {
      credentialsManager.saveProfile('default', 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile('production', 'prod-key')

      credentialsManager.removeProfile('staging')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.have.all.keys('default', 'production')
    })
  })

  describe('profileExists', () => {
    it('should return false if profile does not exist', () => {
      expect(credentialsManager.profileExists('default')).to.be.false
    })

    it('should return true if profile exists', () => {
      credentialsManager.saveProfile('default', 'test-key')

      expect(credentialsManager.profileExists('default')).to.be.true
    })

    it('should return false if credentials file does not exist', () => {
      expect(credentialsManager.profileExists('default')).to.be.false
    })
  })
})
