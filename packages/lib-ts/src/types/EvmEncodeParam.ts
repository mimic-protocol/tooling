import { join, Serializable, serialize, serializeArray, Stringable } from '../helpers'

export class EvmEncodeParam implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'EvmEncodeParam'

  private _type: string
  private _value: string
  private _values: EvmEncodeParam[]

  constructor(type: string, value: string, values: EvmEncodeParam[]) {
    this._type = type
    this._value = value
    this._values = values
  }

  static fromValue<T extends Stringable>(type: string, value: T): EvmEncodeParam {
    return new EvmEncodeParam(type, serialize(value), [])
  }

  static fromValues(type: string, values: EvmEncodeParam[]): EvmEncodeParam {
    return new EvmEncodeParam(type, '', values)
  }

  toString(): string {
    return `${EvmEncodeParam.SERIALIZED_PREFIX}(${join([serialize(this._type), serialize(this._value), serializeArray(this._values)])})`
  }

  serialize(): string {
    return this.toString()
  }
}
