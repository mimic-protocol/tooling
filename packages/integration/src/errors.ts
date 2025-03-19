export class RunnerSpawnError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class RunnerFailureError extends Error {
  public code: number | null
  public output: string

  constructor(code: number | null, output: string) {
    super('Runner Failure')
    this.code = code
    this.output = output
  }
}
