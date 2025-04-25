import { Bytes } from './Bytes'

export class CallParam {
  private _type: string
  private _value: Bytes

  constructor(type: string, value: Bytes) {
    this._type = type
    this._value = value
  }

  get type(): string {
    return this._type
  }

  get value(): Bytes {
    return this._value
  }
}
