import { join, Serializable, serialize } from '../helpers'

/**
 * Represents a parameter for EVM decoding, used to process data returned from smart contract calls.
 * This class specifies the expected ABI type and the encoded data to be decoded.
 */
export class EvmDecodeParam implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'EvmDecodeParam'

  private _abi_type: string
  private _value: string

  /**
   * Creates a new EvmDecodeParam instance.
   * @param abi_type - The ABI type signature for decoding (e.g., "uint256", "address", "string", "(uint256,string)")
   * @param value - The encoded hex string data to be decoded
   */
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
