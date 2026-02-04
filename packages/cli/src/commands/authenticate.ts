import { Command, Flags } from '@oclif/core'
import * as fs from 'fs'

import { CredentialsManager, ProfileCredentials } from '../lib/CredentialsManager'
import log from '../log'
import { FlagsType } from '../types'

export type AuthenticateFlags = FlagsType<typeof Authenticate>

export default class Authenticate extends Command {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(): Promise<any> {
    throw new Error('Method not implemented.')
  }

  static override description = 'Authenticate with Mimic by storing your API key locally'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --profile production --api-key YOUR_API_KEY',
  ]

  static flags = {
    profile: Flags.string({
      char: 'p',
      description: 'Profile name to use for this credential',
    }),
    'api-key': Flags.string({
      char: 'k',
      description: 'API key (non-interactive mode)',
    }),
  }

  public static authenticate(cmd: Command, flags: AuthenticateFlags): ProfileCredentials {
    let apiKey = flags['api-key']
    const profileName = flags.profile || CredentialsManager.getDefaultProfileName()

    const credentialsManager = CredentialsManager.getDefault()
    if (!apiKey) {
      try {
        const credentialsDir = credentialsManager.getBaseDir()
        const credentialsPath = credentialsManager.getCredentialsPath()

        if (!fs.existsSync(credentialsDir)) {
          throw new Error(`No credentials directory found at ${credentialsDir}. Run 'mimic login' to authenticate.`)
        }

        if (!fs.existsSync(credentialsPath)) {
          throw new Error(`No credentials file found. Run 'mimic login' to authenticate.`)
        }

        const profiles = credentialsManager.readCredentials()

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
        apiKey = credentials.apiKey
      } catch (error) {
        if (error instanceof Error) {
          cmd.error(`Authentication required: ${error.message}`, {
            code: 'AuthenticationRequired',
            suggestions: [
              `Run ${log.highlightText('mimic login')} to authenticate`,
              `Run ${log.highlightText(`mimic login --profile ${flags.profile ?? '<profile>'}`)} to create this profile`,
              `Or use ${log.highlightText('--api-key')} flag to provide API key directly`,
            ].filter(Boolean) as string[],
          })
        }
        throw error
      }
    }
    return { apiKey }
  }
}
