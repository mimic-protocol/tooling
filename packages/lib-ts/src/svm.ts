import { JSON } from 'json-as'

import {
  Address,
  SerializableSvmFindProgramAddressResult,
  SvmFindProgramAddressParams,
  SvmFindProgramAddressResult,
  SvmPdaSeed,
} from './types'

export namespace svm {
  @external('svm', '_findProgramAddress')
  declare function _findProgramAddress(params: string): string

  /**
   * Calculates PDA address
   * @param seeds - SvmPdaSeed array of seeds
   * @param programId - Base programId to be derived of
   * @returns The PDA address and bump
   */
  export function findProgramAddress(seeds: SvmPdaSeed[], programId: Address): SvmFindProgramAddressResult {
    const params = new SvmFindProgramAddressParams(seeds, programId.toBase58String())
    const result = _findProgramAddress(JSON.stringify(params))
    const parsed = JSON.parse<SerializableSvmFindProgramAddressResult>(result)
    return SvmFindProgramAddressResult.fromSerializable(parsed)
  }
}
