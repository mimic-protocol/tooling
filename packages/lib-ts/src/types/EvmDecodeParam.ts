import { join, Serializable, serialize } from '../helpers'

export class EvmDecodeParam implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'EvmDecodeParam'

  private _abi_type: string
  private _value: string

  constructor(abi_type: string, value: string) {
    this._abi_type = abi_type
    this._value = value
  }

  toString(): string {
    return `${EvmDecodeParam.SERIALIZED_PREFIX}(${join([serialize(this._abi_type), serialize(this._value)])})`
  }

  serialize(): string {
    return this.toString()
  }
}
