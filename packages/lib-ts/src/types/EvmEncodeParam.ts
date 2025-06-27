import { join, Serializable, serialize, serializeArray, Stringable } from '../helpers'

/**
 * Represents a parameter for EVM encoding, used to prepare data for smart contract calls.
 * This class encapsulates both primitive values and complex structures (arrays, tuples)
 * in a format suitable for ABI encoding.
 */
export class EvmEncodeParam implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'EvmEncodeParam'

  private _type: string
  private _value: string
  private _values: EvmEncodeParam[]

  /**
   * Creates a new EvmEncodeParam instance.
   * @param type - The ABI type signature (e.g., "uint256", "address", "string", "()")
   * @param value - The serialized value for primitive types
   * @param values - Array of nested EvmEncodeParam instances for complex types
   */
  constructor(type: string, value: string, values: EvmEncodeParam[]) {
    this._type = type
    this._value = value
    this._values = values
  }

  /**
   * Creates an EvmEncodeParam for a primitive value.
   * @param type - The ABI type signature (e.g., "uint256", "address", "string")
   * @param value - The value to encode, must implement Stringable interface
   * @returns A new EvmEncodeParam instance representing the primitive value
   */
  static fromValue<T extends Stringable>(type: string, value: T): EvmEncodeParam {
    return new EvmEncodeParam(type, serialize(value), [])
  }

  /**
   * Creates an EvmEncodeParam for complex types like arrays or tuples.
   * @param type - The ABI type signature (e.g., "address[]", "()", "()[]")
   * @param values - Array of EvmEncodeParam instances representing the nested elements
   * @returns A new EvmEncodeParam instance representing the complex type
   */
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
