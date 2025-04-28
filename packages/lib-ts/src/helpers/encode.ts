import { BigInt, Bytes, CallParam } from '../types'

import { EVM_ENCODE_SLOT_SIZE } from './constants'
import { isHex } from './strings'

function isDynamicType(type: string): bool {
  return type === 'string' || type === 'bytes'
}

function uintToBytes32(value: u64): Bytes {
  const valueBytes = BigInt.fromU64(value).toBytesBigEndian()
  if (valueBytes.length <= EVM_ENCODE_SLOT_SIZE) {
    const padding = new Bytes(EVM_ENCODE_SLOT_SIZE - valueBytes.length)
    return padding.concat(valueBytes)
  } else {
    return changetype<Bytes>(valueBytes.slice(valueBytes.length - EVM_ENCODE_SLOT_SIZE))
  }
}

function padToMultipleOf32(data: Bytes): Bytes {
  const remainder = data.length % EVM_ENCODE_SLOT_SIZE

  if (remainder === 0) return data

  const paddingLength = EVM_ENCODE_SLOT_SIZE - remainder
  const padding = new Bytes(paddingLength)

  return data.concat(padding)
}

export function encodeCallData(keccak256: string, params: CallParam[]): Bytes {
  if (keccak256.length != 10) throw new Error('Invalid keccak256: must be exactly 4 bytes (0x + 8 chars)')
  if (!isHex(keccak256, true)) throw new Error('Invalid keccak256: must be a valid hex string (0x prefixed)')

  let selector = Bytes.fromHexString(keccak256)
  let staticPart = new Bytes(0)
  let dynamicPart = new Bytes(0)
  let currentDynamicOffset = params.length * EVM_ENCODE_SLOT_SIZE

  const encodedDynamicData: Bytes[] = []

  // First pass: Encode dynamic data and calculate offsets
  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    if (isDynamicType(param.type)) {
      const dataBytes = param.value
      const lengthBytes = uintToBytes32(dataBytes.length)
      const paddedData = padToMultipleOf32(dataBytes)
      const encodedDynamic = lengthBytes.concat(paddedData)
      encodedDynamicData.push(encodedDynamic)
    }
  }

  // Second pass: Build static and dynamic parts
  let dynamicParamIndex = 0
  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    if (isDynamicType(param.type)) {
      const offsetBytes = uintToBytes32(currentDynamicOffset)
      staticPart = staticPart.concat(offsetBytes)
      const encodedParam = encodedDynamicData[dynamicParamIndex++]
      dynamicPart = dynamicPart.concat(encodedParam)
      currentDynamicOffset += encodedParam.length
    } else {
      const staticValueBytes = param.value
      if (staticValueBytes.length > EVM_ENCODE_SLOT_SIZE) {
        throw new Error(`Static param size exceeds ${EVM_ENCODE_SLOT_SIZE} bytes: ${param.type}`)
      }
      const padding = new Bytes(EVM_ENCODE_SLOT_SIZE - staticValueBytes.length)
      const paddedStatic = padding.concat(staticValueBytes)
      staticPart = staticPart.concat(paddedStatic)
    }
  }

  /* NOTE:
   ** The reverse is necessary because we are building the data in big endian order
   ** but internally it is stored in little endian order
   */
  return selector.concat(staticPart).concat(dynamicPart).reverse()
}
