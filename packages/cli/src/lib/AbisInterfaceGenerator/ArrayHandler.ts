import { AbiParameter, InputType, InputTypeArray } from '../../types'

// Callback type for mapping a base ABI parameter to its type string
export type MapBaseTypeCallback = (param: AbiParameter) => InputType | InputTypeArray | string

export default {
  isArrayType(abiOrMappedType: string): boolean {
    return abiOrMappedType.endsWith(']')
  },

  getBaseAbiType(abiType: string): string {
    if (!this.isArrayType(abiType)) return abiType
    // Correctly handle cases like type[] vs type[N]
    const lastBracket = abiType.lastIndexOf('[')
    if (lastBracket === -1) return abiType // Should not happen if isArrayType is true
    return abiType.substring(0, lastBracket)
  },

  getArrayDepth(abiType: string): number {
    let depth = 0
    let tempType = abiType
    while (tempType.endsWith(']')) {
      depth++
      // Ensure we strip matching brackets if fixed-size arrays are ever specifically handled by this part
      const lastBracket = tempType.lastIndexOf('[')
      if (lastBracket === -1) break
      tempType = tempType.substring(0, lastBracket)
    }
    return depth
  },

  getArrayDepthString(abiType: string): string {
    if (!this.isArrayType(abiType)) return ''
    const idx = abiType.indexOf('[')
    if (idx === -1) return ''
    return abiType.substring(idx)
  },

  /**
   * Recursively finds the ultimate base type of a potentially nested ABI array type string.
   * E.g., for "uint256[][]", it returns "uint256".
   */
  getUltimateBaseAbiType(abiType: string): string {
    let currentType = abiType
    while (this.isArrayType(currentType)) {
      currentType = this.getBaseAbiType(currentType)
    }
    return currentType
  },

  /**
   * Gets the mapped type of the ultimate base element of an array.
   */
  getMappedUltimateBaseType(
    param: AbiParameter,
    mapBaseTypeFunc: MapBaseTypeCallback
  ): InputType | InputTypeArray | string {
    const ultimateBaseAbiType = this.getUltimateBaseAbiType(param.type)
    const baseParam: AbiParameter = {
      ...param,
      type: ultimateBaseAbiType,
      components: ultimateBaseAbiType === 'tuple' ? param.components : undefined,
      internalType: param.internalType ? this.getUltimateBaseAbiType(param.internalType) : undefined,
    }
    return mapBaseTypeFunc(baseParam)
  },

  /**
   * Constructs the full mapped array type string, e.g., "BigInt[][]",
   * based on the mapped ultimate base type and the original ABI array type's depth.
   */
  constructMappedArrayTypeString(originalParam: AbiParameter, mapBaseTypeFunc: MapBaseTypeCallback): string {
    const mappedUltimateBaseType = this.getMappedUltimateBaseType(originalParam, mapBaseTypeFunc)
    const depth = this.getArrayDepth(originalParam.type)
    let finalType = String(mappedUltimateBaseType)
    for (let i = 0; i < depth; i++) {
      finalType += '[]'
    }
    return finalType
  },
}
