import { Command, Flags } from '@oclif/core'
import * as os from 'os'
import * as path from 'path'

// ============================================================================
// Types
// ============================================================================

type Shell = 'bash' | 'zsh' | 'fish'

interface Flag {
  readonly name: string
  readonly char?: string
  readonly description: string
}

interface CommandInfo {
  readonly id: string
  readonly flags: readonly Flag[]
}

// ============================================================================
// Constants
// ============================================================================

const SUPPORTED_SHELLS: readonly Shell[] = ['bash', 'zsh', 'fish'] as const

const COMPLETION_PATHS: Readonly<Record<Shell, (bin: string) => string>> = {
  bash: (bin) => path.join(os.homedir(), '.bashrc'),
  zsh: (bin) => path.join(os.homedir(), '.zshrc'),
  fish: (bin) => path.join(os.homedir(), '.config', 'fish', 'completions', `${bin}.fish`),
} as const

// ============================================================================
// Main Command
// ============================================================================

export default class Completions extends Command {
  static override description = 'Display shell completion instructions'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --shell bash',
    '<%= config.bin %> <%= command.id %> --shell zsh',
    '<%= config.bin %> <%= command.id %> --shell fish',
  ]

  static override flags = {
    shell: Flags.string({
      char: 's',
      description: 'Shell type',
      options: [...SUPPORTED_SHELLS],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Completions)
    const shell = this.resolveShell(flags.shell)
    const commands = this.getAllCommands()
    const bin = this.config.bin

    this.printInstructions(shell, bin, COMPLETION_PATHS[shell](bin))
    console.log(this.generateScript(shell, commands, bin))
  }

  // ============================================================================
  // Command Discovery
  // ============================================================================

  private getAllCommands(): CommandInfo[] {
    return Array.from(this.config.commands)
      .filter(cmd => !cmd.hidden)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(cmd => ({ id: cmd.id, flags: this.extractFlags(cmd) }))
  }

  private extractFlags(cmd: { flags?: Record<string, { char?: string; description?: string }> }): Flag[] {
    if (!cmd.flags) return []
    return Object.entries(cmd.flags).map(([name, def]) => ({
      name,
      char: def.char,
      description: def.description || name,
    }))
  }

  // ============================================================================
  // Shell Resolution
  // ============================================================================

  private resolveShell(provided?: string): Shell {
    if (provided && SUPPORTED_SHELLS.includes(provided as Shell)) return provided as Shell
    const detected = SUPPORTED_SHELLS.find(shell => (process.env.SHELL || '').includes(shell))
    if (detected) return detected
    this.error(`Could not detect shell. Please specify with --shell (${SUPPORTED_SHELLS.join('|')})`)
  }

  // ============================================================================
  // Script Generation
  // ============================================================================

  private generateScript(shell: Shell, commands: readonly CommandInfo[], bin: string): string {
    const generators: Record<Shell, (c: readonly CommandInfo[], b: string) => string> = {
      bash: this.bash.bind(this),
      zsh: this.zsh.bind(this),
      fish: this.fish.bind(this),
    }
    return generators[shell](commands, bin)
  }

  private bash(commands: readonly CommandInfo[], bin: string): string {
    const cmdList = commands.map(c => c.id).join(' ')
    const cases = commands.map(c => this.bashCase(c)).join('\n')
    return `_${bin}_completion() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="${cmdList}"
  
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
    return 0
  fi
  
  case "$prev" in
${cases}
    *)
      COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
      ;;
  esac
}

complete -F _${bin}_completion ${bin}`
  }

  private zsh(commands: readonly CommandInfo[], bin: string): string {
    const cmdList = commands.map(c => `"${c.id}:${c.id} command"`).join('\n    ')
    const cases = commands.map(c => this.zshCase(c)).join('\n')
    return `#compdef ${bin}

_${bin}() {
  local -a commands
  commands=(
    ${cmdList}
  )
  
  _describe 'command' commands
  
  case $words[2] in
${cases}
  esac
}

_${bin} "$@"`
  }

  private fish(commands: readonly CommandInfo[], bin: string): string {
    return commands.flatMap(cmd => this.fishCompletions(cmd, bin)).join('\n')
  }

  // ============================================================================
  // Flag Formatting
  // ============================================================================

  private bashCase(cmd: CommandInfo): string {
    const flags = cmd.flags.flatMap(f => f.char ? [`-${f.char}`, `--${f.name}`] : [`--${f.name}`])
    return `    ${cmd.id})
      COMPREPLY=( $(compgen -W "${flags.join(' ')}" -- "$cur") )
      ;;`
  }

  private zshCase(cmd: CommandInfo): string {
    const flags = cmd.flags.flatMap(f =>
      f.char ? [`"-${f.char}[${f.description}]"`, `"--${f.name}[${f.description}]"`] : [`"--${f.name}[${f.description}]"`]
    )
    const flagList = flags.length > 0 ? `\n        ${flags.join('\n        ')}` : ''
    return `    ${cmd.id})
      local -a flags
      flags=(${flagList}
      )
      _describe 'flags' flags
      ;;`
  }

  private fishCompletions(cmd: CommandInfo, bin: string): string[] {
    const subcmd = `__fish_seen_subcommand_from ${cmd.id}`
    const completions = [
      `complete -c ${bin} -f -n '__fish_use_subcommand' -a '${cmd.id}' -d '${cmd.id} command'`,
    ]
    for (const flag of cmd.flags) {
      if (flag.char) {
        completions.push(`complete -c ${bin} -f -n '${subcmd}' -s ${flag.char} -l ${flag.name} -d '${flag.description}'`)
      }
      completions.push(`complete -c ${bin} -f -n '${subcmd}' -l ${flag.name} -d '${flag.description}'`)
    }
    return completions
  }

  // ============================================================================
  // Output
  // ============================================================================

  private printInstructions(shell: Shell, bin: string, path: string): void {
    console.log(`# ${bin} completion script for ${shell}`)
    console.log('# Install by running:')
    console.log(`#   ${bin} completions --shell ${shell} >> ${path}`)
    console.log('# Then reload your shell:')
    console.log(`#   source ${path}`)
    console.log('')
  }
}
