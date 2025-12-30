import { Command, Flags } from '@oclif/core'

import { CredentialsManager, ProfileCredentials } from '../lib/CredentialsManager'
import log from '../log'

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
      default: CredentialsManager.getDefaultProfileName(),
    }),
    'api-key': Flags.string({
      char: 'k',
      description: 'API key (non-interactive mode)',
    }),
  }

  protected authenticate(flags: { profile?: string; 'api-key'?: string }): ProfileCredentials {
    let apiKey = flags['api-key']
    if (!apiKey) {
      try {
        const credentials = CredentialsManager.getDefault().getCredentials(flags.profile)
        apiKey = credentials.apiKey
      } catch (error) {
        if (error instanceof Error)
          this.error(error.message, {
            code: 'AuthenticationRequired',
            suggestions: [
              `Run ${log.highlightText('mimic login')} to authenticate`,
              flags.profile
                ? `Run ${log.highlightText(`mimic login --profile ${flags.profile}`)} to create this profile`
                : undefined,
              `Or use ${log.highlightText('--api-key')} flag to provide API key directly`,
            ].filter(Boolean) as string[],
          })
        throw error
      }
    }
    return { apiKey }
  }
}
