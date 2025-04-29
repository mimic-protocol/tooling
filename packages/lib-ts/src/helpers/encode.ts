import { Address, BigInt, Bytes, CallParam } from '../types'

import { EVM_ENCODE_SLOT_SIZE } from './constants'
import { isHex } from './strings'

/**
 * Padding function for EVM encoding that handles different padding scenarios
 * @param input - Input value: Bytes
 * @param leftPad - pad from left (true) or right (false). Default: true (for static values)
 * @param exact - pad to exact EVM_ENCODE_SLOT_SIZE (true) or to the next multiple (false). Default: true
 * @param throwOnOversize - throw on oversized input (true) or truncate (false). Default: true
 * @returns Properly padded Bytes
 */
function evmPad(input: Bytes, leftPad: boolean = true, exact: boolean = true, throwOnOversize: boolean = true): Bytes {
  // Calculate the target size and padding length
  let targetSize: i32 = 0
  if (exact) {
    targetSize = EVM_ENCODE_SLOT_SIZE
    if (input.length > targetSize && throwOnOversize) {
      throw new Error('Input bytes exceed EVM_ENCODE_SLOT_SIZE')
    }
  } else {
    // Pad to the next multiple of EVM_ENCODE_SLOT_SIZE
    const remainder = input.length % EVM_ENCODE_SLOT_SIZE
    targetSize = remainder === 0 ? input.length : input.length + (EVM_ENCODE_SLOT_SIZE - remainder)
  }

  // If input is already the target size, return it directly
  if (input.length === targetSize) {
    return input
  }

  // Handle oversized input by truncating if not throwing
  if (input.length > targetSize) {
    return changetype<Bytes>(input.slice(input.length - targetSize))
  }

  // Create padding
  const paddingLength = targetSize - input.length
  const padding = new Bytes(paddingLength)

  // Apply the padding in the right direction
  return leftPad
    ? padding.concat(input) // Left padding (for static values)
    : input.concat(padding) // Right padding (for dynamic values)
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

/**
 * Encodes array values per Ethereum ABI spec
 * @param abiType - ABI type string (e.g. 'uint256[]', 'address[3]')
 * @param values - Values to encode (BigInt, Address, or Bytes)
 * @returns Encoded bytes for EVM
 * @throws For string arrays, size mismatches, or unsupported types
 */
export function evmEncodeArray<T>(abiType: string, values: T[]): Bytes {
  let encodedElements = new Bytes(0)
  const isDynamicArray = abiType.endsWith('[]')

  if (abiType === 'string[]') {
    throw new Error('Encoding for string[] not fully implemented yet.')
  }

  // Encode each element
  for (let i = 0; i < values.length; i++) {
    let elementBytes: Bytes
    const element = values[i]

    if (element instanceof BigInt) {
      elementBytes = evmPad(element.toBytesBigEndian())
    } else if (element instanceof Address) {
      elementBytes = evmPad(element)
    } else if (element instanceof Bytes) {
      elementBytes = evmPad(element.reverse())
    } else {
      throw new Error(`Unsupported element type in array: ${abiType}`)
    }
    encodedElements = encodedElements.concat(elementBytes)
  }

  if (isDynamicArray) {
    const lengthBytes = evmPad(BigInt.fromU64(values.length as u64).toBytesBigEndian())
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

/**
 * EVM Encode
 *
 * This function encodes a function selector and parameters into a bytes array
 * according to the EVM encoding rules. Note that encodes in big endian order
 * but internally it is stored in little endian order.
 *
 * @param keccak256 - The function selector (4 bytes)
 * @param params - The parameters to encode
 *
 * @returns The encoded bytes array
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
        const lengthBytes = evmPad(BigInt.fromU64(dataBytes.length as u64).toBytesBigEndian())
        const paddedData = evmPad(dataBytes, false, false, false) // right pad to word boundary
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
      const offsetBytes = evmPad(BigInt.fromU64(currentDynamicOffset as u64).toBytesBigEndian())
      staticPart = staticPart.concat(offsetBytes)
      const encodedParam = dynamicDataSegments[dynamicParamIndex++]
      dynamicPart = dynamicPart.concat(encodedParam)
      currentDynamicOffset += encodedParam.length
    } else if (isFixedArray(paramType)) {
      const staticArrayBytes = param.value
      staticPart = staticPart.concat(staticArrayBytes)
    } else {
      const staticValueBytes = param.value
      const paddedStatic = evmPad(staticValueBytes)
      staticPart = staticPart.concat(paddedStatic)
    }
  }

  return selector.concat(staticPart).concat(dynamicPart)
}
