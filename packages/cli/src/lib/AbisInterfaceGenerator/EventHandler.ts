import { AssemblyPrimitiveTypes } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
import FunctionHandler from './FunctionHandler'
import type ImportManager from './ImportManager'
import NameManager, { NameContext } from './NameManager'
import TupleHandler from './TupleHandler'
import type { AbiItem, EventDefinitionsMap } from './types'

export default class EventHandler {
  public static extractEventDefinitions(abi: AbiItem[]): EventDefinitionsMap {
    const eventDefinitions: EventDefinitionsMap = new Map()

    abi.forEach((item) => {
      if (item.type !== 'event') return
      const components = NameManager.resolveParameterNames(item.inputs || [], NameContext.CLASS_PROPERTY)
      eventDefinitions.set(item.name, {
        className: `${item.name}Event`,
        components,
      })
    })

    return eventDefinitions
  }

  public static generateEventClassesCode(
    eventDefinitions: EventDefinitionsMap,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): string {
    if (eventDefinitions.size === 0) return ''
    importManager.addType('JSON')

    const lines: string[] = []

    eventDefinitions.forEach((def) => {
      lines.push(`export class ${def.className} {`)

      const components = def.components

      components.forEach((comp) => {
        const fieldName = comp.escapedName!
        const componentType = abiTypeConverter.mapAbiType(comp)
        lines.push(`  readonly ${fieldName}: ${componentType}`)
      })

      lines.push('')

      const constructorParams = components
        .map((comp) => `${comp.escapedName!}: ${abiTypeConverter.mapAbiType(comp)}`)
        .join(', ')

      lines.push(`  constructor(${constructorParams}) {`)
      components.forEach((comp) => {
        const fieldName = comp.escapedName!
        lines.push(`    this.${fieldName} = ${fieldName}`)
      })
      lines.push(`  }`)
      lines.push('')

      const decodeAbiType = TupleHandler.generateTupleTypeString(
        'tuple',
        def.components.map((c) => ({ type: c.type, components: c.components }))
      )
      importManager.addType('evm')
      importManager.addType('EvmDecodeParam')
      lines.push(`  static decode(data: ${AssemblyPrimitiveTypes.string}): ${def.className} {`)
      lines.push(`    const decoded = evm.decode(new EvmDecodeParam('${decodeAbiType}', data))`)
      lines.push(`    return ${def.className}.parse(decoded)`)
      lines.push(`  }`)
      lines.push('')

      lines.push(`  static parse(data: string): ${def.className} {`)
      lines.push(`    const parts = JSON.parse<${AssemblyPrimitiveTypes.string}[]>(data)`)
      lines.push(`    if (parts.length !== ${def.components.length}) throw new Error("Invalid data for event parsing")`)

      const componentsWithVarNames = NameManager.resolveParameterNames(def.components, NameContext.LOCAL_VARIABLE)

      componentsWithVarNames.forEach((comp, index) => {
        const fieldName = comp.escapedName!
        const mappedType = abiTypeConverter.mapAbiType(comp)
        const dataAccess = `parts[${index}]`
        const parseLogic = TupleHandler.buildFieldParseLogic(
          dataAccess,
          comp,
          mappedType,
          abiTypeConverter,
          importManager
        )
        lines.push(`    const ${fieldName}: ${mappedType} = ${parseLogic};`)
      })

      const constructorArgs = componentsWithVarNames.map((r) => r.escapedName!).join(', ')
      lines.push(`    return new ${def.className}(${constructorArgs})`)
      lines.push(`  }`)
      lines.push('')

      lines.push(`  toEvmEncodeParams(): EvmEncodeParam[] {`)
      importManager.addType('EvmEncodeParam')
      lines.push(`    return [`)
      def.components.forEach((comp) => {
        const fieldName = comp.escapedName!
        const valueAccessPath = `this.${fieldName}`
        const paramCode = FunctionHandler.buildEvmEncodeParamCode(
          valueAccessPath,
          comp,
          abiTypeConverter,
          importManager
        )
        lines.push(`      ${paramCode},`)
      })
      lines.push(`    ]`)
      lines.push(`  }`)

      lines.push(`}`)
      lines.push('')
    })

    return lines.join('\n')
  }
}
