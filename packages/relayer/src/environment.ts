export default class Environment {
  public intents: number[] = []
  private _value: number | undefined

  setValue(value: number) {
    this._value = value
  }

  getValue(): number {
    if (!this._value) throw Error('"getValue" was not populated')
    return this._value
  }

  calculate(a: number, b: number): number {
    return a + b
  }

  createIntent(intent: number): void {
    this.intents.push(intent)
  }
}
