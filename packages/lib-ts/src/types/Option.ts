export class Option<T> {
  constructor(
    private _value: T,
    public readonly isSome: bool
  ) {}

  static some<T>(value: T): Option<T> {
    return new Option<T>(value, true)
  }

  static none<T>(defaultValue: T = 0 as T): Option<T> {
    return new Option<T>(defaultValue, false)
  }

  unwrap(): T {
    if (this.isSome) return this._value
    throw new Error("Can't unwrap None variant")
  }

  eq(other: Option<T>): bool {
    if (this.isSome != other.isSome) return false
    if (!this.isSome && !other.isSome) return true
    return this._value == other._value
  }

  toString(): string {
    if (!this.isSome) return 'None'
    // @ts-expect-error: AssemblyScript lacks runtime reflection, so we assume toString exists
    return `Some(${this._value.toString ? this._value.toString() : '[Object]'})`
  }
}
