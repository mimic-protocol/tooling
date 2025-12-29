import { confirm } from '@inquirer/prompts'
import { Command, Flags } from '@oclif/core'

import { CredentialsManager } from '../lib/CredentialsManager'
import log from '../log'

export default class Logout extends Command {
  static override description = 'Remove stored credentials for a profile'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile staging',
  ]

  static override flags = {
    profile: Flags.string({
      char: 'p',
      description: 'Profile name to remove',
      default: 'default',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Logout)
    const { profile: profileName, force } = flags

    const profiles = CredentialsManager.getDefault().getProfiles()
    if (!profiles.includes(profileName)) {
      this.error(`Profile '${profileName}' does not exist`, {
        code: 'ProfileNotFound',
        suggestions:
          profiles.length > 0
            ? [`Available profiles: ${profiles.join(', ')}`]
            : ['No profiles found. Use `mimic login` to create one.'],
      })
    }

    if (!force) {
      const shouldRemove = await confirm({
        message: `Are you sure you want to remove credentials for profile ${log.highlightText(profileName)}?`,
        default: false,
      })

      if (!shouldRemove) {
        console.log('Logout cancelled')
        this.exit(0)
      }
    }

    log.startAction(`Removing credentials for profile ${profileName}`)
    CredentialsManager.getDefault().removeProfile(profileName)
    log.stopAction()

    console.log(`✓ Credentials removed for profile ${log.highlightText(profileName)}`)
  }
}
