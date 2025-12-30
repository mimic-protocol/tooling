import { confirm, input, password } from '@inquirer/prompts'
import { Flags } from '@oclif/core'

import { CredentialsManager } from '../lib/CredentialsManager'
import log from '../log'

import Authenticate from './authenticate'

export default class Login extends Authenticate {
  static override description = 'Authenticate with Mimic by storing your API key locally'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --profile production --api-key YOUR_API_KEY',
  ]

  static override flags = {
    ...Authenticate.flags,
    'force-login': Flags.boolean({
      char: 'f',
      description: 'Force login even if profile exists',
      default: false,
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
              if (!value || value.trim() === '') return 'Profile name cannot be empty'
              if (value.includes('[') || value.includes(']') || value.includes('='))
                return 'Profile name cannot contain [, ], or = characters'
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

    this.saveAndConfirm(profileName || CredentialsManager.getDefaultProfileName(), apiKey, flags['force-login'])
  }

  private async saveAndConfirm(profileName: string, apiKey: string, forceLogin: boolean): Promise<void> {
    try {
      const credentialsManager = CredentialsManager.getDefault()

      if (credentialsManager.profileExists(profileName) && !forceLogin) {
        const shouldOverwrite = await confirm({
          message: `Profile ${log.highlightText(profileName)} already exists. Overwrite?`,
          default: false,
        })

        if (!shouldOverwrite) {
          console.log('Login cancelled')
          return
        }
      }

      log.startAction('Saving credentials')
      credentialsManager.saveProfile(profileName, apiKey)
      log.stopAction()

      console.log(`✓ Credentials saved for profile ${log.highlightText(profileName)}`)
      console.log(`  Location: ${log.highlightText('~/.mimic/credentials')}`)
      console.log()
      console.log(`You can now deploy tasks using: ${log.highlightText('mimic deploy')}`)
      if (profileName !== CredentialsManager.getDefaultProfileName()) {
        console.log(`Or with your profile: ${log.highlightText(`mimic deploy --profile ${profileName}`)}`)
      }
    } catch (error) {
      if (error instanceof Error) this.error(`Failed to save credentials: ${error.message}`)
      throw error
    }
  }
}
