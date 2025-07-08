import { JSON } from 'json-as'

import { serialize, Stringable } from '../helpers'

@json
export class EvmEncodeParam {
  constructor(
    public readonly abiType: string,
    public readonly value: string
  ) {}

  /**
   * Creates an EvmEncodeParam for a primitive value.
   * @param type - The ABI type signature (e.g., "uint256", "address", "string")
   * @param value - The value to encode, must implement Stringable interface
   * @returns A new EvmEncodeParam instance representing the primitive value
   */
  static fromValue<T extends Stringable>(type: string, value: T): EvmEncodeParam {
    return new EvmEncodeParam(type, serialize(value))
  }

  /**
   * Creates an EvmEncodeParam for complex types like arrays or tuples.
   * @param type - The ABI type signature (e.g., "address[]", "()", "()[]")
   * @param values - Array of EvmEncodeParam instances representing the nested elements
   * @returns A new EvmEncodeParam instance representing the complex type
   */
  static fromValues(type: string, values: EvmEncodeParam[]): EvmEncodeParam {
    return new EvmEncodeParam(type, JSON.stringify(values))
  }
}
