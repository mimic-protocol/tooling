import { EvmDecodeParam, EvmEncodeParam } from './types'
import { join, serialize, serializeArray } from './helpers'

export namespace evm {
  @external('evm', '_encode')
  declare function _encode(params: string): string

  @external('evm', '_decode')
  declare function _decode(params: string): string

  @external('evm', '_keccak')
  declare function _keccak(params: string): string
  export function encode(callParameters: EvmEncodeParam[]): string {
    return _encode(join([serializeArray(callParameters)]))
  }

  export function decode(encodedData: EvmDecodeParam): string {
    return _decode(serialize(encodedData))
  }

  export function keccak(data: string): string {
    return _keccak(data)
  }
}
