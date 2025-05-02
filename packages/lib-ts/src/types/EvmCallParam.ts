import { Bytes } from './Bytes'
import { join, Serializable, serialize, serializeArray } from "../helpers";

export class EvmCallParam implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'EvmCallParam'

  private _type: string
  private _value: Bytes
  private _values: EvmCallParam[]

  constructor(type: string, value: Bytes, values: EvmCallParam[]) {
    this._type = type
    this._value = value
    this._values = values
  }

  static fromValue(type: string, value: Bytes): EvmCallParam {
    return new EvmCallParam(type, value, [])
  }

  static fromValues(type: string, values: EvmCallParam[]): EvmCallParam {
    return new EvmCallParam(type, Bytes.empty(), values)
  }

  toString(): string {
    return `${EvmCallParam.SERIALIZED_PREFIX}(${join([serialize(this._type), serialize(this._value), serializeArray(this._values)])})`
  }

  serialize(): string {
    return this.toString();
  }
}
