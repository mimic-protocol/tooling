import { AbiFunctionItem, AbiParameter } from '../../types'

import { AbiTypeConverter } from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import { ImportManager } from './ImportManager'

export type TupleDefinition = {
  className: string
  components: AbiParameter[]
}

export type TupleDefinitionsMap = Map<string, TupleDefinition>

export class TupleHandler {
  /**
   * Checks if the given ABI type string ultimately represents a tuple.
   * E.g., 'tuple', 'tuple[]', 'tuple[2]' would all return true.
   */
  public static isTupleType(abiType: string): boolean {
    const ultimateBaseAbiType = ArrayHandler.getBaseAbiType(abiType)
    return ultimateBaseAbiType === 'tuple'
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
    if (!this.isTupleType(param.type)) return undefined

    const baseInternalType = param.internalType ? ArrayHandler.getBaseAbiType(param.internalType) : undefined

    if (baseInternalType && tupleDefinitions.has(baseInternalType))
      return tupleDefinitions.get(baseInternalType)!.className

    const representativeParamForSearch: AbiParameter = {
      ...param,
      type: 'tuple',
    }
    const existingByStructure = this.findMatchingDefinition(representativeParamForSearch, tupleDefinitions)
    if (existingByStructure) return existingByStructure.className

    return undefined
  }

  public static extractTupleDefinitions(abi: AbiFunctionItem[]): TupleDefinitionsMap {
    const tupleDefinitions: TupleDefinitionsMap = new Map()
    let tupleCounter = 0

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

      if (!tupleToDefine.components || tupleToDefine.components.length === 0) return

      const existingClassName = this.getClassNameForTupleDefinition(tupleToDefine, tupleDefinitions)
      if (existingClassName) return existingClassName

      let className = `Tuple${tupleCounter++}`
      const baseInternalType = tupleToDefine.internalType
        ? ArrayHandler.getBaseAbiType(tupleToDefine.internalType)
        : undefined

      if (baseInternalType) {
        const structMatch = baseInternalType.match(/struct\s+(?:\w+\.)?(\w+)/)
        if (structMatch && structMatch[1]) className = structMatch[1]
      }

      const key = baseInternalType || className

      tupleDefinitions.set(key, {
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

    return tupleDefinitions
  }

  public static findMatchingDefinition(
    param: AbiParameter,
    definitions: TupleDefinitionsMap
  ): TupleDefinition | undefined {
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

  public static generateTupleTypeString(type: string, components: AbiParameter[] | undefined): string {
    const arrayDepthString = ArrayHandler.getArrayDepthString(type)
    if (!components || components.length === 0) return `()${arrayDepthString}`

    const typeStrings = components.map((comp) => {
      if (this.isTupleType(comp.type) && comp.components)
        return this.generateTupleTypeString(comp.type, comp.components)
      return comp.type
    })
    return `(${typeStrings.join(',')})${arrayDepthString}`
  }

  public static mapTupleType(abiType: string): string {
    if (!this.isTupleType(abiType)) throw new Error(`${abiType} is not a tuple type`)
    const arrayDepthStr = ArrayHandler.getArrayDepthString(abiType)
    return `()${arrayDepthStr}`
  }

  public static generateTupleClassesCode(
    tupleDefinitions: TupleDefinitionsMap,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): string {
    if (tupleDefinitions.size === 0) return ''
    importManager.addType('parseCSV')

    const lines: string[] = []

    tupleDefinitions.forEach((def) => {
      lines.push(`export class ${def.className} {`)

      def.components.forEach((comp, index) => {
        const fieldName = comp.name || `field${index}`
        const componentType = abiTypeConverter.mapAbiType(comp)
        lines.push(`  readonly ${fieldName}: ${componentType}`)
      })

      lines.push('')

      const constructorParams = def.components
        .map((comp, index) => {
          const fieldName = comp.name || `field${index}`
          const componentType = abiTypeConverter.mapAbiType(comp)
          return `${fieldName}: ${componentType}`
        })
        .join(', ')

      lines.push(`  constructor(${constructorParams}) {`)
      def.components.forEach((comp, index) => {
        const fieldName = comp.name || `field${index}`
        lines.push(`    this.${fieldName} = ${fieldName}`)
      })
      lines.push(`  }`)
      lines.push('')

      lines.push(`  static _parse(data: string): ${def.className} {`)
      lines.push(`    const parts = changetype<string[]>(parseCSV(data))`)
      lines.push(`    if (parts.length !== ${def.components.length}) throw new Error("Invalid data for tuple parsing")`)

      lines.push(...this.generateTupleParseMethodBody(def, abiTypeConverter, importManager))

      const constructorArgs = def.components.map((comp, index) => `${comp.name || `field${index}`}`).join(', ')
      lines.push(`    return new ${def.className}(${constructorArgs})`)
      lines.push(`  }`)
      lines.push('')

      lines.push(`  toEvmEncodeParams(): EvmEncodeParam[] {`)
      importManager.addType('EvmEncodeParam')
      lines.push(`    return [`)
      lines.push(...this.generateTupleToEvmParamsMethodBody(def, abiTypeConverter))
      lines.push(`    ]`)
      lines.push(`  }`)
      lines.push(`}`)
      lines.push('')
    })
    return lines.join('\n')
  }

  private static generateTupleParseMethodBody(
    def: TupleDefinition,
    abiTypeConverter: AbiTypeConverter,
    importManager: ImportManager
  ): string[] {
    const parseLines = def.components.map((comp: AbiParameter, index: number) => {
      const fieldName = comp.name || `field${index}`
      const componentType = abiTypeConverter.mapAbiType(comp)

      const isAbiArray = ArrayHandler.isArrayType(comp.type)
      const abiBaseType = isAbiArray ? ArrayHandler.getArrayAbiType(comp.type) : ''

      if (isAbiArray && this.isTupleType(abiBaseType)) {
        const mappedComponentTypeStr = componentType
        const baseMappedType = ArrayHandler.getArrayAbiType(mappedComponentTypeStr)
        return this.generateParseArrayOfCustomObjectsCode(
          'parts',
          index,
          fieldName,
          mappedComponentTypeStr,
          baseMappedType,
          importManager
        )
      } else if (isAbiArray) {
        importManager.addType('parseCSV')
        let baseInternalType: string | undefined = undefined
        if (comp.internalType) {
          baseInternalType = ArrayHandler.isArrayType(comp.internalType)
            ? ArrayHandler.getArrayAbiType(comp.internalType)
            : comp.internalType
        }

        const baseCompAbiParameter: AbiParameter = {
          name: comp.name ? `${comp.name}_base` : `field${index}_base`,
          type: abiBaseType,
          internalType: baseInternalType,
          components: undefined,
        }
        const inputType = abiTypeConverter.mapAbiType(baseCompAbiParameter)

        const elementConversionLogic = abiTypeConverter.generateTypeConversion(inputType, 'value', false, false)
        return `    const ${fieldName}: ${componentType} = parts[${index}] === '' ? [] : changetype<string[]>(parseCSV(parts[${index}])).map<${inputType}>((value) => ${elementConversionLogic});`
      } else {
        const conversion = abiTypeConverter.generateTypeConversion(componentType, `parts[${index}]`, false, false)
        return `    const ${fieldName}: ${componentType} = ${conversion}`
      }
    })
    return parseLines
  }

  private static generateParseArrayOfCustomObjectsCode(
    csvPartsVarName: string,
    itemIndex: number,
    fieldName: string,
    mappedComponentType: string,
    baseMappedType: string,
    importManager: ImportManager
  ): string {
    importManager.addType('parseCSV')
    return `    const ${fieldName}: ${mappedComponentType} = ${csvPartsVarName}[${itemIndex}] === '' ? [] : changetype<string[]>(parseCSV(${csvPartsVarName}[${itemIndex}])).map<${baseMappedType}>((item) => ${baseMappedType}._parse(item))`
  }

  private static generateTupleToEvmParamsMethodBody(
    def: TupleDefinition,
    abiTypeConverter: AbiTypeConverter
  ): string[] {
    const paramLines: string[] = []
    def.components.forEach((comp: AbiParameter, index: number) => {
      const fieldName = comp.name || `field${index}`
      const componentType = abiTypeConverter.mapAbiType(comp)
      let paramCode: string

      if (this.isTupleType(comp.type)) {
        const tupleType = this.mapTupleType(comp.type)
        const isArray = ArrayHandler.isArrayType(tupleType)
        paramCode = `EvmEncodeParam.fromValues('${tupleType}', ${isArray ? `this.${fieldName}.map<EvmEncodeParam>((s) => EvmEncodeParam.fromValues('()', s.toEvmEncodeParams()))` : `this.${fieldName}.toEvmEncodeParams()`})`
      } else {
        const convertedValue = abiTypeConverter.toLibType(componentType, `this.${fieldName}`)
        paramCode = `EvmEncodeParam.fromValue('${comp.type}', ${convertedValue})`
      }
      paramLines.push(`      ${paramCode},`)
    })
    return paramLines
  }
}
