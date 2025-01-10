export default class Environment {
  private prefix = 'environment'
  private output: number[] = []

  getNumber(): number {
    console.log('>>> getNumber called')
    return Math.floor(Math.random() * 10)
  }

  create(value: number): void {
    console.log(`>>> ${this.prefix}.create(${value})`)
    this.output.push(value)
  }

  getOutput(): number[] {
    return this.output
  }

  generate(calls: string[]): Record<string, (...args: never) => unknown> {
    const imports: Record<string, (...args: never) => unknown> = {}
    for (const call of calls) {
      switch (call) {
        case 'getNumber':
          imports[`${this.prefix}.${call}`] = this.getNumber
          break
        case 'create':
          imports[`${this.prefix}.${call}`] = this.create.bind(this)
          break
        default:
          throw new Error('Unknown environment call: ' + call)
      }
    }
    return imports
  }
}
