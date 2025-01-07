import build from './commands/build'

export function runCLI(args: string[]) {
  const [command, ...rest] = args

  switch (command) {
    case 'build':
      return build(rest)
    default:
      console.log(`Command ${command} unavailable`)
      process.exit(0)
  }
}
