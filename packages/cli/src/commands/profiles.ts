import { Command } from '@oclif/core'

import { CredentialsManager } from '../lib/CredentialsManager'
import log from '../log'

export default class Profiles extends Command {
  static override description = 'List all configured authentication profiles'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    const profiles = CredentialsManager.getDefault().getProfiles()

    if (profiles.length === 0) {
      console.log('No profiles found.')
      console.log()
      console.log(`Run ${log.highlightText('mimic login')} to create your first profile.`)
      return
    }

    console.log(`Configured profiles (stored in ${log.highlightText('~/.mimic/credentials')}):`)
    console.log()

    for (const profile of profiles) {
      const isDefault = profile === 'default'
      console.log(`* ${log.highlightText(profile)}${isDefault ? ' (default)' : ''}`)
    }

    console.log()
    console.log(`Use ${log.highlightText('mimic deploy --profile <name>')} to deploy with a specific profile.`)
  }
}
