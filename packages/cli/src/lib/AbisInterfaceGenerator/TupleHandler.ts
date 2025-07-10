import { pascalCase } from '../../helpers'
import { type AbiFunctionItem, type AbiParameter, AssemblyPrimitiveTypes } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import FunctionHandler from './FunctionHandler'
import type ImportManager from './ImportManager'
import NameManager, { NameContext } from './NameManager'
import type { TupleDefinition, TupleDefinitionsMap } from './types'
import { TUPLE_ABI_TYPE } from './types'

export default class TupleHandler {
  /**
   * Checks if the given ABI type string ultimately represents a tuple.
   * E.g., 'tuple', 'tuple[]', 'tuple[2]' would all return true.
   */
  public static isBaseTypeATuple(abiType: string): boolean {
    return ArrayHandler.getBaseType(abiType) === TUPLE_ABI_TYPE
  }

  /**
   * Checks if the given value is a tuple class name.
   */
  public static isTupleClassName(value: string, tupleDefinitions: TupleDefinitionsMap): boolean {
    return [...tupleDefinitions.values()].some((def) => def.className === value)
  }

  /**
   * Gets the class name for an already defined tuple.
   * Uses internalType or structural matching if necessary.
   */
  public static getClassNameForTupleDefinition(
    param: AbiParameter,
    tupleDefinitions: TupleDefinitionsMap
  ): string | undefined {
    if (!this.isBaseTypeATuple(param.type)) return undefined

    const baseInternalType = param.internalType ? ArrayHandler.getBaseType(param.internalType) : undefined

    if (baseInternalType && tupleDefinitions.has(baseInternalType))
      return tupleDefinitions.get(baseInternalType)!.className

    const representativeParamForSearch: AbiParameter = {
      ...param,
      type: TUPLE_ABI_TYPE,
    }
    const existingByStructure = this.findMatchingDefinition(representativeParamForSearch, tupleDefinitions)
    if (existingByStructure) return existingByStructure.className

    return undefined
  }

  public static extractTupleDefinitions(abi: AbiFunctionItem[]): TupleDefinitionsMap {
    const tupleDefinitions: TupleDefinitionsMap = new Map()
    let tupleCounter = 0

    const processParam = (param: AbiParameter): string | undefined => {
      if (!this.isBaseTypeATuple(param.type)) {
        param.components?.forEach(processParam)
        return
      }

      const tupleToDefine: AbiParameter = {
        name: param.name,
        type: TUPLE_ABI_TYPE,
        internalType: param.internalType,
        components: param.components,
      }

      if (!tupleToDefine.components || tupleToDefine.components.length === 0) return

      const existingClassName = this.getClassNameForTupleDefinition(tupleToDefine, tupleDefinitions)
      if (existingClassName) return existingClassName

      let className = `Tuple${tupleCounter++}`
      const baseInternalType = tupleToDefine.internalType
        ? ArrayHandler.getBaseType(tupleToDefine.internalType)
        : undefined

      if (baseInternalType) {
        const structMatch = baseInternalType.match(/struct\s+(?:\w+\.)?(\w+)/)
        if (structMatch && structMatch[1]) className = structMatch[1]
      }

      const key = baseInternalType || className
      const components = this.resolveComponentNames(tupleToDefine.components, NameContext.CLASS_PROPERTY)

      tupleDefinitions.set(key, {
        className,
        components,
      })

      tupleToDefine.components.forEach((subComp) => processParam(subComp))

      return className
    }

    abi.forEach((item) => {
      if (item.type !== 'function') return
      item.inputs?.forEach((input) => processParam(input))
      item.outputs?.forEach((output) => processParam(output))

      if (item.outputs && item.outputs.length > 1) {
        const name = this.getOutputTupleClassName(item.name)

        const representativeOutputTuple: AbiParameter = {
          name,
          type: TUPLE_ABI_TYPE,
          internalType: `struct ${name}`,
          components: item.outputs,
        }
        processParam(representativeOutputTuple)
      }
    })

    return tupleDefinitions
  }

  public static findMatchingDefinition(
    param: AbiParameter,
    definitions: TupleDefinitionsMap
  ): TupleDefinition | undefined {
    if (!param.components || param.type !== TUPLE_ABI_TYPE) return undefined
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

  public static generateTupleTypeString(type: string, components: AbiParameter[] | undefined): string {
    if (!components || components.length === 0) return this.mapTupleType(type)

    const typeStrings = components.map((comp) => {
      if (this.isBaseTypeATuple(comp.type) && comp.components)
        return this.generateTupleTypeString(comp.type, comp.components)
      return comp.type
    })
    return this.mapTupleType(type, typeStrings.join(','))
  }

  public static mapTupleType(abiType: string, tupleContent: string = ''): string {
    if (!this.isBaseTypeATuple(abiType)) throw new Error(`${abiType} is not a tuple type`)
    return abiType.replace(TUPLE_ABI_TYPE, `(${tupleContent})`)
  }

  public static generateTupleClassesCode(
    tupleDefinitions: TupleDefinitionsMap,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): string {
    if (tupleDefinitions.size === 0) return ''
    importManager.addType('JSON')

    const lines: string[] = []

    tupleDefinitions.forEach((def) => {
      lines.push(`export class ${def.className} {`)

      const components = def.components

      components.forEach((comp) => {
        const fieldName = comp.escapedName!
        const componentType = abiTypeConverter.mapAbiType(comp)
        lines.push(`  readonly ${fieldName}: ${componentType}`)
      })

      lines.push('')

      const constructorParams = components
        .map((comp) => {
          const fieldName = comp.escapedName!
          const componentType = abiTypeConverter.mapAbiType(comp)
          return `${fieldName}: ${componentType}`
        })
        .join(', ')

      lines.push(`  constructor(${constructorParams}) {`)
      components.forEach((comp) => {
        const fieldName = comp.escapedName!
        lines.push(`    this.${fieldName} = ${fieldName}`)
      })
      lines.push(`  }`)
      lines.push('')

      lines.push(`  static parse(data: string): ${def.className} {`)
      lines.push(`    const parts = JSON.parse<${AssemblyPrimitiveTypes.string}[]>(data)`)
      lines.push(`    if (parts.length !== ${def.components.length}) throw new Error("Invalid data for tuple parsing")`)

      const componentsWithVarNames = this.resolveComponentNames(def.components, NameContext.LOCAL_VARIABLE)

      lines.push(
        ...this.getTupleParseMethodBody({ ...def, components: componentsWithVarNames }, abiTypeConverter, importManager)
      )

      const constructorArgs = componentsWithVarNames.map((r) => r.escapedName!).join(', ')
      lines.push(`    return new ${def.className}(${constructorArgs})`)
      lines.push(`  }`)
      lines.push('')

      lines.push(`  toEvmEncodeParams(): EvmEncodeParam[] {`)
      importManager.addType('EvmEncodeParam')
      lines.push(`    return [`)
      lines.push(...this.getTupleToEvmParamsMethodBody(def, abiTypeConverter, importManager))
      lines.push(`    ]`)
      lines.push(`  }`)
      lines.push(`}`)
      lines.push('')
    })
    return lines.join('\n')
  }

  public static getOutputTupleClassName(functionName: string): string {
    const fnNamePart = functionName.replace(/[^a-zA-Z0-9_]/g, '')
    if (!fnNamePart) return 'UnnamedFunctionOutputs'
    return `${pascalCase(fnNamePart)}Outputs`
  }

  private static getTupleParseMethodBody(
    def: TupleDefinition,
    abiTypeConverter: AbiTypeConverter,
    importManager: ImportManager
  ): string[] {
    return def.components.map((comp: AbiParameter, index: number) => {
      const fieldName = comp.escapedName!
      const mappedComponentType = abiTypeConverter.mapAbiType(comp)
      const dataAccess = `parts[${index}]`
      const parseLogic = this.buildFieldParseLogic(
        dataAccess,
        comp,
        mappedComponentType,
        abiTypeConverter,
        importManager
      )
      return `    const ${fieldName}: ${mappedComponentType} = ${parseLogic};`
    })
  }

  private static buildFieldParseLogic(
    dataAccessString: string,
    componentAbiParam: AbiParameter,
    mappedTargetType: string,
    abiTypeConverter: AbiTypeConverter,
    importManager: ImportManager,
    depth: number = 0
  ): string {
    importManager.addType('JSON')

    const isAbiArray = ArrayHandler.isArrayType(componentAbiParam.type)
    const baseAbiType = ArrayHandler.getBaseType(componentAbiParam.type)

    if (isAbiArray) {
      const elementType = ArrayHandler.getArrayType(mappedTargetType)
      const itemVar = `item${depth}`

      const elementAbiParam: AbiParameter = {
        ...componentAbiParam,
        name: `${componentAbiParam.name || 'arrayElement'}_${itemVar}`,
        type: ArrayHandler.getArrayType(componentAbiParam.type),
        components: baseAbiType === TUPLE_ABI_TYPE ? componentAbiParam.components : undefined,
        internalType: componentAbiParam.internalType
          ? ArrayHandler.getArrayType(componentAbiParam.internalType)
          : undefined,
      }

      const subLogic = this.buildFieldParseLogic(
        itemVar,
        elementAbiParam,
        elementType,
        abiTypeConverter,
        importManager,
        depth + 1
      )
      return `${dataAccessString} === '' ? [] : JSON.parse<${AssemblyPrimitiveTypes.string}[]>(${dataAccessString}).map<${elementType}>(((${itemVar}: ${AssemblyPrimitiveTypes.string}) => ${subLogic}))`
    }

    return abiTypeConverter.generateTypeConversion(mappedTargetType, dataAccessString, false, false)
  }

  private static getTupleToEvmParamsMethodBody(
    def: TupleDefinition,
    abiTypeConverter: AbiTypeConverter,
    importManager: ImportManager
  ): string[] {
    return def.components.map((comp: AbiParameter) => {
      const fieldName = comp.escapedName!
      const valueAccessPath = `this.${fieldName}`
      const paramCode = FunctionHandler.buildEvmEncodeParamCode(valueAccessPath, comp, abiTypeConverter, importManager)
      return `      ${paramCode},`
    })
  }

  private static resolveComponentNames(components: AbiParameter[], context: NameContext): AbiParameter[] {
    return NameManager.resolveParameterNames(components, context, 'field')
  }
}
