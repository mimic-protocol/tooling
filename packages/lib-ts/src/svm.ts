import { JSON } from 'json-as'

import { SerializableSvmFindProgramAddressResult, SvmFindProgramAddressParams, SvmFindProgramAddressResult } from './types/SvmFindProgramAddress'

export namespace svm {
  @external('svm', '_findProgramAddress')
  declare function _findProgramAddress(params: string): string

  /**
   * Calculates PDA address
   * @param params - Seeds, program address
   * @returns The PDA address as base58
   */
  export function findProgramAddress(params: SvmFindProgramAddressParams): SvmFindProgramAddressResult {
    const result = _findProgramAddress(JSON.stringify(params))
    const parsed = JSON.parse<SerializableSvmFindProgramAddressResult>(result)
    return SvmFindProgramAddressResult.fromSerializable(parsed)
  }
}
