import { AbiParameter } from '../../types'

export type MapBaseTypeCallback = (param: AbiParameter) => string

export default class ArrayHandler {
  static isArrayType(abiOrMappedType: string): boolean {
    return abiOrMappedType.endsWith(']')
  }

  /**
   * Returns the base type of an array, e.g., "uint256[2][]" -> "uint256[2]".
   */
  static getArrayType(type: string): string {
    if (!this.isArrayType(type)) return type
    const lastBracket = type.lastIndexOf('[')
    if (lastBracket === -1) return type
    return type.substring(0, lastBracket)
  }

  /**
   * Returns the depth of an array, e.g., "uint256[][]" -> 2.
   */
  static getArrayDepth(abiType: string): number {
    let depth = 0
    let tempType = abiType
    while (tempType.endsWith(']')) {
      depth++
      const lastBracket = tempType.lastIndexOf('[')
      if (lastBracket === -1) break
      tempType = tempType.substring(0, lastBracket)
    }
    return depth
  }

  /**
   * Returns the string representation of the array depth, e.g., "uint256[2][]" -> "[2][]".
   */
  static getArrayDepthString(abiType: string): string {
    const idx = abiType.indexOf('[')
    if (idx === -1) return ''
    return abiType.substring(idx)
  }

  /**
   * Recursively finds the  base type of a potentially nested ABI array type string.
   * E.g., for "uint256[][]", it returns "uint256".
   */
  static getBaseType(type: string): string {
    const bracketIndex = type.indexOf('[')
    if (bracketIndex === -1) return type
    return type.substring(0, bracketIndex)
  }

  /**
   * Gets the mapped type of the  base element of an array.
   */
  static baseAbiTypeToLibType(param: AbiParameter, mapBaseTypeFunc: MapBaseTypeCallback): string {
    const baseAbiType = this.getBaseType(param.type)
    const baseParam: AbiParameter = {
      ...param,
      type: baseAbiType,
      components: baseAbiType === 'tuple' ? param.components : undefined,
      internalType: param.internalType ? this.getBaseType(param.internalType) : undefined,
    }
    return mapBaseTypeFunc(baseParam)
  }

  /**
   * Constructs the full lib type array string, e.g., "BigInt[][]",
   * based on the original ABI array type's depth.
   */
  static generateLibTypeArray(originalParam: AbiParameter, mapBaseTypeFunc: MapBaseTypeCallback): string {
    const mappedBaseType = this.baseAbiTypeToLibType(originalParam, mapBaseTypeFunc)
    const depth = this.getArrayDepth(originalParam.type)
    return mappedBaseType + '[]'.repeat(depth)
  }
}
