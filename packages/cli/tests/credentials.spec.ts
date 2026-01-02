import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { CredentialsManager } from '../src/lib/CredentialsManager'

const DEFAULT_PROFILE = 'default'

describe('credentials', () => {
  let tempDir: string
  let credentialsManager: CredentialsManager

  beforeEach('create a temporary directory for testing', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mimic-test-'))
    credentialsManager = new CredentialsManager(tempDir)
  })

  afterEach('clean up temp directory', () => {
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
      const content = `[${DEFAULT_PROFILE}]\napi_key=test-key-123\n`
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'test-key-123' },
      })
    })

    it('should parse multiple profiles correctly', () => {
      const content = `
[${DEFAULT_PROFILE}]
api_key=default-key

[staging]
api_key=staging-key

[production]
api_key=prod-key
`
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'default-key' },
        staging: { apiKey: 'staging-key' },
        production: { apiKey: 'prod-key' },
      })
    })

    it('should ignore comments and empty lines', () => {
      const content = `
# This is a comment
[${DEFAULT_PROFILE}]
; This is also a comment
api_key=test-key

# Another comment
[staging]
api_key=staging-key
`
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'test-key' },
        staging: { apiKey: 'staging-key' },
      })
    })

    it('should handle keys with spaces around equals sign', () => {
      const content = `[${DEFAULT_PROFILE}]\napi_key = test-key-123 \n`
      const profiles = credentialsManager.parseCredentials(content)

      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'test-key-123' },
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
        [DEFAULT_PROFILE]: { apiKey: 'test-key-123' },
      }
      const content = credentialsManager.serializeCredentials(profiles)

      expect(content).to.equal(`[${DEFAULT_PROFILE}]\napi_key=test-key-123\n`)
    })

    it('should serialize multiple profiles correctly', () => {
      const profiles = {
        [DEFAULT_PROFILE]: { apiKey: 'default-key' },
        staging: { apiKey: 'staging-key' },
      }
      const content = credentialsManager.serializeCredentials(profiles)

      expect(content).to.include(`[${DEFAULT_PROFILE}]\napi_key=default-key\n`)
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
      fs.writeFileSync(credentialsPath, `[${DEFAULT_PROFILE}]\napi_key=test-key\n`)

      const profiles = credentialsManager.readCredentials()

      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'test-key' },
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

      credentialsManager.writeCredentials({ [DEFAULT_PROFILE]: { apiKey: 'test-key' } })

      expect(fs.existsSync(credDir)).to.be.true
    })

    it('should write credentials to file', () => {
      const profiles = {
        [DEFAULT_PROFILE]: { apiKey: 'test-key' },
        staging: { apiKey: 'staging-key' },
      }

      credentialsManager.writeCredentials(profiles)

      const credentialsPath = credentialsManager.getCredentialsPath()
      expect(fs.existsSync(credentialsPath)).to.be.true

      const content = fs.readFileSync(credentialsPath, 'utf-8')
      expect(content).to.include(`[${DEFAULT_PROFILE}]`)
      expect(content).to.include('api_key=test-key')
      expect(content).to.include('[staging]')
      expect(content).to.include('api_key=staging-key')
    })

    it('should set file permissions to 600 on Unix systems', function () {
      if (process.platform === 'win32') {
        this.skip()
        return
      }

      credentialsManager.writeCredentials({ [DEFAULT_PROFILE]: { apiKey: 'test-key' } })

      const credentialsPath = credentialsManager.getCredentialsPath()
      const stats = fs.statSync(credentialsPath)
      const mode = stats.mode & 0o777

      expect(mode).to.equal(0o600)
    })
  })

  describe('saveProfile', () => {
    it('should save a new profile', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key-123')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'test-key-123' },
      })
    })

    it('should update an existing profile', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'old-key')
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'new-key')

      const profiles = credentialsManager.readCredentials()
      expect(profiles[DEFAULT_PROFILE].apiKey).to.equal('new-key')
    })

    it('should not affect other profiles when updating', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'updated-default-key')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'updated-default-key' },
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
      expect(() => credentialsManager.getProfile(DEFAULT_PROFILE)).to.throw(/No credentials directory found/)
    })

    it('should throw error if credentials file does not exist', () => {
      credentialsManager.createCredentialsDirIfNotExists()
      expect(() => credentialsManager.getProfile(DEFAULT_PROFILE)).to.throw(/No credentials file found/)
    })

    it('should throw error if profile does not exist', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key')
      expect(() => credentialsManager.getProfile('nonexistent')).to.throw(/Profile 'nonexistent' not found/)
    })

    it('should include available profiles in error message', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key')
      credentialsManager.saveProfile('staging', 'staging-key')

      try {
        credentialsManager.getProfile('nonexistent')
        expect.fail('Should have thrown an error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error.message).to.include(DEFAULT_PROFILE)
        expect(error.message).to.include('staging')
      }
    })

    it('should throw error if api_key is empty', () => {
      credentialsManager.createCredentialsDirIfNotExists()
      const credentialsPath = credentialsManager.getCredentialsPath()
      fs.writeFileSync(credentialsPath, `[${DEFAULT_PROFILE}]\napi_key=\n`)

      expect(() => credentialsManager.getProfile(DEFAULT_PROFILE)).to.throw(/has no API key/)
    })

    it('should return profile credentials if valid', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key-123')

      const credentials = credentialsManager.getProfile(DEFAULT_PROFILE)

      expect(credentials).to.deep.equal({ apiKey: 'test-key-123' })
    })

    it('should default to "default" profile if no name provided', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'default-key')

      const credentials = credentialsManager.getProfile()

      expect(credentials.apiKey).to.equal('default-key')
    })
  })

  describe('ensureLoggedIn', () => {
    it('should return credentials if profile exists', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key')

      const credentials = credentialsManager.getCredentials(DEFAULT_PROFILE)

      expect(credentials).to.deep.equal({ apiKey: 'test-key' })
    })

    it('should throw error with user-friendly message if not logged in', () => {
      expect(() => credentialsManager.getCredentials(DEFAULT_PROFILE)).to.throw(/Authentication required/)
    })

    it('should default to "default" profile', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key')

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
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile('production', 'prod-key')

      const profiles = credentialsManager.getProfiles()

      expect(profiles).to.have.members([DEFAULT_PROFILE, 'staging', 'production'])
    })
  })

  describe('removeProfile', () => {
    it('should throw error if profile does not exist', () => {
      expect(() => credentialsManager.removeProfile('nonexistent')).to.throw(/does not exist/)
    })

    it('should remove a profile', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')

      credentialsManager.removeProfile('staging')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.deep.equal({
        [DEFAULT_PROFILE]: { apiKey: 'default-key' },
      })
    })

    it('should not affect other profiles', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'default-key')
      credentialsManager.saveProfile('staging', 'staging-key')
      credentialsManager.saveProfile('production', 'prod-key')

      credentialsManager.removeProfile('staging')

      const profiles = credentialsManager.readCredentials()
      expect(profiles).to.have.all.keys(DEFAULT_PROFILE, 'production')
    })
  })

  describe('profileExists', () => {
    it('should return false if profile does not exist', () => {
      expect(credentialsManager.profileExists(DEFAULT_PROFILE)).to.be.false
    })

    it('should return true if profile exists', () => {
      credentialsManager.saveProfile(DEFAULT_PROFILE, 'test-key')

      expect(credentialsManager.profileExists(DEFAULT_PROFILE)).to.be.true
    })

    it('should return false if credentials file does not exist', () => {
      expect(credentialsManager.profileExists(DEFAULT_PROFILE)).to.be.false
    })
  })
})
