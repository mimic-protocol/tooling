import { AbiFunctionItem, AbiParameter } from '../../types'

import ArrayHandler from './ArrayHandler'

export type TupleDefinition = {
  className: string
  components: AbiParameter[]
}

export type TupleDefinitionsMap = Map<string, TupleDefinition>

export class TupleHandler {
  private tupleDefinitions: TupleDefinitionsMap
  private tupleCounter: number

  constructor() {
    this.tupleDefinitions = new Map()
    this.tupleCounter = 0
  }

  /**
   * Checks if the given ABI type string ultimately represents a tuple.
   * E.g., 'tuple', 'tuple[]', 'tuple[2]' would all return true.
   */
  public isTupleType(abiType: string): boolean {
    const ultimateBaseAbiType = ArrayHandler.getUltimateBaseAbiType(abiType)
    return ultimateBaseAbiType === 'tuple'
  }

  /**
   * Checks if the given value is a tuple class name.
   */
  public isTupleClassName(value: string): boolean {
    return [...this.tupleDefinitions.values()].some((def) => def.className === value)
  }

  /**
   * Gets the class name for an already defined tuple.
   * Uses internalType or structural matching if necessary.
   */
  public getClassNameForTupleDefinition(param: AbiParameter): string | undefined {
    if (!this.isTupleType(param.type)) return undefined

    const baseInternalType = param.internalType ? ArrayHandler.getUltimateBaseAbiType(param.internalType) : undefined

    if (baseInternalType && this.tupleDefinitions.has(baseInternalType)) {
      return this.tupleDefinitions.get(baseInternalType)!.className
    }

    const representativeParamForSearch: AbiParameter = {
      ...param,
      type: 'tuple', // Ensure we search for the base tuple structure
    }
    const existingByStructure = this.findMatchingDefinition(representativeParamForSearch, this.tupleDefinitions)
    if (existingByStructure) {
      return existingByStructure.className
    }

    return undefined
  }

  public extractTupleDefinitions(abi: AbiFunctionItem[]): TupleDefinitionsMap {
    this.tupleDefinitions.clear()
    this.tupleCounter = 0

    const processParam = (param: AbiParameter): string | undefined => {
      if (!this.isTupleType(param.type)) {
        param.components?.forEach((subComp) => processParam(subComp))
        return
      }

      const tupleToDefine: AbiParameter = {
        name: param.name,
        type: 'tuple',
        internalType: param.internalType,
        components: param.components,
      }

      if (!tupleToDefine.components || tupleToDefine.components.length === 0) {
        return
      }

      const existingClassName = this.getClassNameForTupleDefinition(tupleToDefine)
      if (existingClassName) return existingClassName

      let className = `Tuple${this.tupleCounter++}`
      const baseInternalType = tupleToDefine.internalType
        ? ArrayHandler.getUltimateBaseAbiType(tupleToDefine.internalType)
        : undefined

      if (baseInternalType) {
        const structMatch = baseInternalType.match(/struct\s+(?:\w+\.)?(\w+)/)
        if (structMatch && structMatch[1]) {
          className = structMatch[1]
        }
      }

      const key = baseInternalType || className

      this.tupleDefinitions.set(key, {
        className,
        components: tupleToDefine.components,
      })

      tupleToDefine.components.forEach((subComp) => processParam(subComp))

      return className
    }

    abi.forEach((item) => {
      if (item.type !== 'function') return
      item.inputs?.forEach((input) => processParam(input))
      item.outputs?.forEach((output) => processParam(output))

      if (item.outputs && item.outputs.length > 1) {
        let fnNamePart = item.name.replace(/[^a-zA-Z0-9_]/g, '')
        if (!fnNamePart) fnNamePart = 'UnnamedFunction'
        fnNamePart = fnNamePart.charAt(0).toUpperCase() + fnNamePart.slice(1)
        const preferredName = `${fnNamePart}Outputs`

        const representativeOutputTuple: AbiParameter = {
          name: preferredName,
          type: 'tuple',
          internalType: `struct ${preferredName}`,
          components: item.outputs,
        }
        processParam(representativeOutputTuple)
      }
    })

    return this.tupleDefinitions
  }

  public findMatchingDefinition(param: AbiParameter, definitions: TupleDefinitionsMap): TupleDefinition | undefined {
    if (!param.components || param.type !== 'tuple') return undefined
    return [...definitions.values()].find(
      (def) =>
        def.components.length === param.components!.length &&
        def.components.every(
          (c, i) =>
            c.type === param.components![i].type &&
            (c.name === param.components![i].name || !c.name || !param.components![i].name)
        )
    )
  }

  public generateTupleTypeString(type: string, components: AbiParameter[] | undefined): string {
    const arrayDepthString = ArrayHandler.getArrayDepthString(type)
    if (!components || components.length === 0) return `()${arrayDepthString}`

    const typeStrings = components.map((comp) => {
      if (this.isTupleType(comp.type) && comp.components) {
        return this.generateTupleTypeString(comp.type, comp.components)
      }
      return comp.type
    })
    return `(${typeStrings.join(',')})${arrayDepthString}`
  }

  public getDefinitions(): TupleDefinitionsMap {
    return this.tupleDefinitions
  }

  public mapTupleType(abiType: string): string {
    if (!this.isTupleType(abiType)) throw new Error(`${abiType} is not a tuple type`)
    const arrayDepthStr = ArrayHandler.getArrayDepthString(abiType)
    return `()${arrayDepthStr}`
  }
}
