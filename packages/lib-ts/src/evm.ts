import { EvmDecodeParam, EvmEncodeParam } from './types'
import { join, serialize, serializeArray } from './helpers'

export namespace evm {
  @external('evm', '_encode')
  declare function _encode(params: string): string

  @external('evm', '_decode')
  declare function _decode(params: string): string

  @external('evm', '_keccak')
  declare function _keccak(params: string): string
  
  /**
   * Encodes parameters for EVM smart contract function calls using ABI encoding.
   * @param callParameters - Array of parameters to encode for the contract call
   * @returns The ABI-encoded data as a hex string
   */
  export function encode(callParameters: EvmEncodeParam[]): string {
    return _encode(join([serializeArray(callParameters)]))
  }

  /**
   * Decodes EVM contract call response data according to specified types.
   * @param encodedData - The encoded data configuration specifying how to decode the response
   * @returns The decoded data as a formatted string
   */
  export function decode(encodedData: EvmDecodeParam): string {
    return _decode(serialize(encodedData))
  }

  /**
   * Computes the Keccak-256 hash of the input data.
   * @param data - The input data to hash
   * @returns The Keccak-256 hash as a hex string
   */
  export function keccak(data: string): string {
    return _keccak(data)
  }
}
