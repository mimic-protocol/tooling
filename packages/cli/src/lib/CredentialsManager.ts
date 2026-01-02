import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const CREDENTIALS_FILE = 'credentials'
const DEFAULT_PROFILE = 'default'

export interface ProfileCredentials {
  apiKey: string
}

export class CredentialsManager {
  private readonly baseDir: string

  static getDefault(): CredentialsManager {
    return new CredentialsManager()
  }

  static getCredentialsFileName(): string {
    return CREDENTIALS_FILE
  }

  static getDefaultProfileName(): string {
    return DEFAULT_PROFILE
  }

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.mimic')
  }

  getBaseDir(): string {
    return this.baseDir
  }

  getCredentialsPath(): string {
    return path.join(this.getBaseDir(), CREDENTIALS_FILE)
  }

  createCredentialsDirIfNotExists(): void {
    if (fs.existsSync(this.getBaseDir())) return
    fs.mkdirSync(this.getBaseDir(), { recursive: true })

    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(this.getBaseDir(), 0o700)
      } catch {}
    }
  }

  parseCredentials(content: string): Record<string, ProfileCredentials> {
    const profiles: Record<string, ProfileCredentials> = {}
    const lines = content.split('\n')
    let currentProfile: string | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue

      const profileMatch = trimmed.match(/^\[([^\]]+)\]$/)
      if (profileMatch) {
        currentProfile = profileMatch[1]
        profiles[currentProfile] = { apiKey: '' }
        continue
      }

      if (currentProfile) {
        const kvMatch = trimmed.match(/^([^=]+)=(.*)$/)
        if (kvMatch) {
          const key = kvMatch[1].trim()
          const value = kvMatch[2].trim()

          if (key === 'api_key') profiles[currentProfile].apiKey = value
        }
      }
    }

    return profiles
  }

  serializeCredentials(profiles: Record<string, ProfileCredentials>): string {
    const lines: string[] = []

    const profileEntries = Object.entries(profiles)
    profileEntries.forEach(([profileName, credentials]) => {
      lines.push(`[${profileName}]`)
      lines.push(`api_key=${credentials.apiKey}`)
      lines.push('')
    })

    return lines.join('\n')
  }

  readCredentials(): Record<string, ProfileCredentials> {
    const credentialsPath = this.getCredentialsPath()

    if (!fs.existsSync(credentialsPath)) return {}

    const content = fs.readFileSync(credentialsPath, 'utf-8')
    return this.parseCredentials(content)
  }

  writeCredentials(profiles: Record<string, ProfileCredentials>): void {
    this.createCredentialsDirIfNotExists()

    const credentialsPath = this.getCredentialsPath()
    const content = this.serializeCredentials(profiles)

    fs.writeFileSync(credentialsPath, content, { mode: 0o600 })

    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(credentialsPath, 0o600)
      } catch {}
    }
  }

  saveProfile(profileName: string, apiKey: string): void {
    const profiles = this.readCredentials()
    profiles[profileName] = { apiKey }
    this.writeCredentials(profiles)
  }

  getProfile(profileName: string = 'default'): ProfileCredentials {
    const credentialsDir = this.getBaseDir()
    const credentialsPath = this.getCredentialsPath()

    if (!fs.existsSync(credentialsDir)) {
      throw new Error(`No credentials directory found at ${credentialsDir}. Run 'mimic login' to authenticate.`)
    }

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`No credentials file found. Run 'mimic login' to authenticate.`)
    }

    const profiles = this.readCredentials()

    if (!profiles[profileName]) {
      const availableProfiles = Object.keys(profiles)
      const suggestion =
        availableProfiles.length > 0
          ? `Available profiles: ${availableProfiles.join(', ')}`
          : `No profiles found. Run 'mimic login' to create one.`

      throw new Error(`Profile '${profileName}' not found. ${suggestion}`)
    }

    const credentials = profiles[profileName]

    if (!credentials.apiKey || credentials.apiKey.trim() === '') {
      throw new Error(
        `Profile '${profileName}' has no API key. Run 'mimic login --profile ${profileName}' to update credentials.`
      )
    }

    return credentials
  }

  getCredentials(profileName: string = DEFAULT_PROFILE): ProfileCredentials {
    try {
      return this.getProfile(profileName)
    } catch (error) {
      if (error instanceof Error) throw new Error(`Authentication required: ${error.message}`)
      throw error
    }
  }

  getProfiles(): string[] {
    const profiles = this.readCredentials()
    return Object.keys(profiles)
  }

  removeProfile(profileName: string): void {
    const profiles = this.readCredentials()

    if (!profiles[profileName]) throw new Error(`Profile '${profileName}' does not exist`)

    delete profiles[profileName]
    this.writeCredentials(profiles)
  }

  profileExists(profileName: string): boolean {
    const profiles = this.readCredentials()
    return profileName in profiles
  }
}
