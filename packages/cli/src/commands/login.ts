import { input, password } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'

import { CredentialsManager, ProfileCredentials } from '../lib/CredentialsManager'
import log from '../log'

export default class Login extends Command {
  static override description = 'Authenticate with Mimic by storing your API key locally'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --profile production --api-key YOUR_API_KEY',
  ]

  static override flags = {
    profile: Flags.string({
      char: 'p',
      description: 'Profile name to use for this credential',
    }),
    'api-key': Flags.string({
      char: 'k',
      description: 'API key (non-interactive mode)',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Login)
    const { profile: profileInput, 'api-key': apiKeyFlag } = flags

    let apiKey: string
    let profileName = profileInput

    // Non-interactive mode
    if (apiKeyFlag) {
      apiKey = apiKeyFlag
    } else {
      // Interactive mode
      try {
        apiKey = await password({
          message: 'Enter your API key:',
          mask: '*',
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'API key cannot be empty'
            }
            return true
          },
        })

        if (!profileName) {
          profileName = await input({
            message: `Enter a profile name (press Enter for "${CredentialsManager.getDefaultProfileName()}"):`,
            default: CredentialsManager.getDefaultProfileName(),
            validate: (value) => {
              if (!value || value.trim() === '') {
                return 'Profile name cannot be empty'
              }
              if (value.includes('[') || value.includes(']') || value.includes('=')) {
                return 'Profile name cannot contain [, ], or = characters'
              }
              return true
            },
          })
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('User force closed')) {
          console.log('\nLogin cancelled')
          this.exit(0)
        }
        throw error
      }
    }

    this.saveAndConfirm(profileName || CredentialsManager.getDefaultProfileName(), apiKey)
  }

  private saveAndConfirm(profileName: string, apiKey: string): void {
    try {
      log.startAction('Saving credentials')
      CredentialsManager.getDefault().saveProfile(profileName, apiKey)
      log.stopAction()

      console.log(`✓ Credentials saved for profile ${log.highlightText(profileName)}`)
      console.log(`  Location: ${log.highlightText('~/.mimic/credentials')}`)
      console.log()
      console.log(`You can now deploy tasks using: ${log.highlightText('mimic deploy')}`)
      if (profileName !== 'default') {
        console.log(`Or with your profile: ${log.highlightText(`mimic deploy --profile ${profileName}`)}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to save credentials: ${error.message}`)
      }
      throw error
    }
  }

  protected authenticate(flags: { profile?: string; 'api-key'?: string }): ProfileCredentials {
    let apiKey = flags['api-key']
    if (!apiKey) {
      try {
        const credentials = CredentialsManager.getDefault().getCredentials(flags.profile)
        apiKey = credentials.apiKey
      } catch (error) {
        if (error instanceof Error) {
          this.error(error.message, {
            code: 'AuthenticationRequired',
            suggestions: [
              `Run ${log.highlightText('mimic login')} to authenticate`,
              flags.profile !== 'default'
                ? `Run ${log.highlightText(`mimic login --profile ${flags.profile}`)} to create this profile`
                : undefined,
              `Or use ${log.highlightText('--key')} flag to provide API key directly`,
            ].filter(Boolean) as string[],
          })
        }
        throw error
      }
    }
    return { apiKey }
  }
}
