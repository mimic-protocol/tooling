import { Address, BigInt, Bytes, CallParam } from '../types'

import { EVM_ENCODE_SLOT_SIZE } from './constants'
import { isHex } from './strings'

function padBytes32(bytes: Bytes): Bytes {
  if (bytes.length > EVM_ENCODE_SLOT_SIZE) throw new Error('Bytes are too long')

  return new Bytes(EVM_ENCODE_SLOT_SIZE - bytes.length).concat(bytes)
}

function isDynamicType(type: string): bool {
  // Array types containing '[]' but not fixed size '[\d+]' are dynamic.
  // Also includes base dynamic types like 'string' and 'bytes'.
  if (type.includes('[]')) return true
  if (type === 'string' || type === 'bytes') return true
  if (type.includes('[')) return false

  return false
}

function isArrayType(type: string): bool {
  return type.includes('[')
}

function isFixedArray(type: string): bool {
  return isArrayType(type) && !type.endsWith('[]')
}

function toEvmBytes32(value: u64): Bytes {
  const valueBytes = BigInt.fromU64(value).toBytesBigEndian()
  if (valueBytes.length <= EVM_ENCODE_SLOT_SIZE) {
    const padding = new Bytes(EVM_ENCODE_SLOT_SIZE - valueBytes.length)
    return padding.concat(valueBytes)
  } else {
    return changetype<Bytes>(valueBytes.slice(valueBytes.length - EVM_ENCODE_SLOT_SIZE))
  }
}

function padToWordBoundary(data: Bytes): Bytes {
  const remainder = data.length % EVM_ENCODE_SLOT_SIZE

  if (remainder === 0) return data

  const paddingLength = EVM_ENCODE_SLOT_SIZE - remainder
  const padding = new Bytes(paddingLength)

  return data.concat(padding)
}

export function evmEncodeArray<T>(abiType: string, values: T[]): Bytes {
  let encodedElements = new Bytes(0)
  const isDynamicArray = abiType.endsWith('[]')

  // Special handling for string arrays, as string itself is dynamic
  if (abiType === 'string[]') {
    // For string[], each element is dynamic. Need to calculate offsets within the array encoding.
    // Simplified: treat as bytes[] for now, needs proper dynamic element offset calculation
    // This requires a more complex encoding similar to encodeCallData itself
    throw new Error('Encoding for string[] not fully implemented yet.') // Placeholder
  }

  // Encode each element
  for (let i = 0; i < values.length; i++) {
    let elementBytes: Bytes
    const element = values[i]

    if (element instanceof BigInt) {
      elementBytes = padBytes32(element.toBytesBigEndian())
    } else if (element instanceof Address) {
      elementBytes = padBytes32(element)
    } else if (element instanceof Bytes) {
      elementBytes = padBytes32(element.reverse())
    } else {
      throw new Error(`Unsupported element type in array: ${abiType}`)
    }
    encodedElements = encodedElements.concat(elementBytes)
  }

  if (isDynamicArray) {
    const lengthBytes = toEvmBytes32(values.length as u64)
    return lengthBytes.concat(encodedElements)
  } else {
    // Fixed arrays just have concatenated elements
    // Extract array size N from type string like "bytes32[N]"
    const openBracketIndex = abiType.lastIndexOf('[')
    const closeBracketIndex = abiType.lastIndexOf(']')
    if (openBracketIndex === -1 || closeBracketIndex === -1 || closeBracketIndex !== abiType.length - 1)
      throw new Error(`Could not parse size from fixed array type format: ${abiType}`)

    const sizeStr = abiType.slice(openBracketIndex + 1, closeBracketIndex)
    const arraySize = i32.parse(sizeStr)
    if (arraySize == 0 || arraySize < 0)
      throw new Error(`Invalid or non-positive size parsed from fixed array type: ${abiType}`)

    const expectedSize = arraySize * EVM_ENCODE_SLOT_SIZE

    if (encodedElements.length != expectedSize)
      throw new Error(
        `Encoded fixed array size mismatch for type ${abiType}. Expected ${arraySize} elements, got ${encodedElements.length / EVM_ENCODE_SLOT_SIZE}`
      )

    if (values.length != arraySize)
      throw new Error(
        `Input array length mismatch for fixed array type ${abiType}. Expected ${arraySize}, got ${values.length}`
      )

    return encodedElements
  }
}

/*
 ** EVM Encode
 **
 ** This function encodes a function selector and parameters into a bytes array
 ** according to the EVM encoding rules. Note that encodes in big endian order
 ** but internally it is stored in little endian order.
 **
 ** @param keccak256 - The function selector (4 bytes)
 ** @param params - The parameters to encode
 **
 ** @returns The encoded bytes array
 */
export function evmEncode(keccak256: string, params: CallParam[]): Bytes {
  if (keccak256.length != 10) throw new Error('Invalid keccak256: must be exactly 4 bytes (0x + 8 chars)')
  if (!isHex(keccak256, true)) throw new Error('Invalid keccak256: must be a valid hex string (0x prefixed)')

  let selector = Bytes.fromHexString(keccak256)
  let staticPart = Bytes.empty()
  let dynamicPart = Bytes.empty()
  let currentDynamicOffset = params.length * EVM_ENCODE_SLOT_SIZE

  const dynamicDataSegments: Bytes[] = []

  // First pass: Encode dynamic data and calculate offsets
  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    const paramType = param.type

    if (isDynamicType(paramType) || isArrayType(paramType)) {
      let dataToEncode: Bytes
      if (paramType === 'string' || paramType === 'bytes') {
        const dataBytes = param.value
        const lengthBytes = toEvmBytes32(dataBytes.length as u64)
        const paddedData = padToWordBoundary(dataBytes)
        dataToEncode = lengthBytes.concat(paddedData)
      } else if (isArrayType(paramType)) {
        dataToEncode = param.value
      } else {
        throw new Error(`Unhandled dynamic or array type in first pass: ${paramType}`)
      }

      if (isDynamicType(paramType)) {
        dynamicDataSegments.push(dataToEncode)
      }
    }
  }

  // Second pass: Build static and dynamic parts
  let dynamicParamIndex = 0
  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    const paramType = param.type

    if (isDynamicType(paramType)) {
      const offsetBytes = toEvmBytes32(currentDynamicOffset)
      staticPart = staticPart.concat(offsetBytes)
      const encodedParam = dynamicDataSegments[dynamicParamIndex++]
      dynamicPart = dynamicPart.concat(encodedParam)
      currentDynamicOffset += encodedParam.length
    } else if (isFixedArray(paramType)) {
      const staticArrayBytes = param.value
      staticPart = staticPart.concat(staticArrayBytes)
    } else {
      const staticValueBytes = param.value
      const paddedStatic = padBytes32(staticValueBytes)
      staticPart = staticPart.concat(paddedStatic)
    }
  }

  return selector.concat(staticPart).concat(dynamicPart)
}
