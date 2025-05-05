import { join, Serializable, serialize, serializeArray, Stringable } from '../helpers'

export class EvmCallParam implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'EvmCallParam'

  private _type: string
  private _value: string
  private _values: EvmCallParam[]

  constructor(type: string, value: string, values: EvmCallParam[]) {
    this._type = type
    this._value = value
    this._values = values
  }

  static fromValue<T extends Stringable>(type: string, value: T): EvmCallParam {
    return new EvmCallParam(type, serialize(value), [])
  }

  static fromValues(type: string, values: EvmCallParam[]): EvmCallParam {
    return new EvmCallParam(type, '', values)
  }

  toString(): string {
    return `${EvmCallParam.SERIALIZED_PREFIX}(${join([serialize(this._type), serialize(this._value), serializeArray(this._values)])})`
  }

  serialize(): string {
    return this.toString()
  }
}
