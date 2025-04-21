import { Bytes } from '../types'

import { EVM_ENCODE_SLOT_SIZE } from './constants'
import { isHex } from './strings'

export function encodeCallData(keccak256: string, params: Bytes[]): Bytes {
  if (keccak256.length != 10) throw new Error('Invalid keccak256: must be exactly 4 bytes (0x + 8 chars)')
  if (!isHex(keccak256, true)) throw new Error('Invalid keccak256: must be a valid hex string (0x prefixed)')

  return params.reduce<Bytes>((acc, param) => {
    if (param.length > EVM_ENCODE_SLOT_SIZE)
      throw new Error(`Bytes length is greater than fixed length: ${param.length} > ${EVM_ENCODE_SLOT_SIZE}`)

    const paddedParam = new Bytes(EVM_ENCODE_SLOT_SIZE - param.length).concat(param)
    return acc.concat(paddedParam)
  }, Bytes.fromHexString(keccak256))
}
