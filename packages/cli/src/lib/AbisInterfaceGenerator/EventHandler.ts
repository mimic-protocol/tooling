import { AssemblyPrimitiveTypes } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
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
      const componentsWithIndexed = components.map((comp, index) => ({
        ...comp,
        indexed: item.inputs?.[index]?.indexed || false,
      }))
      eventDefinitions.set(item.name, {
        className: `${item.name}Event`,
        components: componentsWithIndexed,
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

      const indexedParams = def.components.filter((c) => c.indexed)
      const nonIndexedParams = def.components.filter((c) => !c.indexed)

      importManager.addType('evm')
      importManager.addType('EvmDecodeParam')

      const topicsParam = indexedParams.length > 0 ? 'topics' : '_topics'
      const dataParam = nonIndexedParams.length > 0 ? 'data' : '_data'

      lines.push(
        `  static decode(${topicsParam}: ${AssemblyPrimitiveTypes.string}[], ${dataParam}: ${AssemblyPrimitiveTypes.string}): ${def.className} {`
      )

      const localVarMap = new Map<string, string>()

      // Decode indexed parameters from topics
      if (indexedParams.length > 0) {
        lines.push(`    // Decode indexed parameters from topics`)
        NameManager.resolveParameterNames(indexedParams, NameContext.LOCAL_VARIABLE).forEach((param, index) => {
          const varName = param.escapedName!
          localVarMap.set(indexedParams[index].escapedName!, varName)
          const mappedType = abiTypeConverter.mapAbiType(param)
          const rawValue = `evm.decode(new EvmDecodeParam('${param.type}', topics[${index + 1}]))` // Skip topics[0] which is event signature
          lines.push(
            `    const ${varName}: ${mappedType} = ${abiTypeConverter.generateTypeConversion(mappedType, rawValue, false, false)}`
          )
        })
      }

      // Decode non-indexed parameters from data
      if (nonIndexedParams.length > 0) {
        lines.push(`    // Decode non-indexed parameters from data`)
        const dataAbiType =
          nonIndexedParams.length === 1
            ? nonIndexedParams[0].type
            : TupleHandler.generateTupleTypeString(
                'tuple',
                nonIndexedParams.map((c) => ({ type: c.type, components: c.components }))
              )
        lines.push(`    const decodedData = evm.decode(new EvmDecodeParam('${dataAbiType}', data))`)

        const nonIndexedWithVarNames = NameManager.resolveParameterNames(nonIndexedParams, NameContext.LOCAL_VARIABLE)
        if (nonIndexedParams.length === 1) {
          const param = nonIndexedWithVarNames[0]
          const varName = param.escapedName!
          localVarMap.set(nonIndexedParams[0].escapedName!, varName)
          const mappedType = abiTypeConverter.mapAbiType(param)
          lines.push(
            `    const ${varName}: ${mappedType} = ${abiTypeConverter.generateTypeConversion(mappedType, 'decodedData', false, false)}`
          )
        } else {
          importManager.addType('JSON')
          lines.push(`    const dataParts = JSON.parse<${AssemblyPrimitiveTypes.string}[]>(decodedData)`)
          nonIndexedWithVarNames.forEach((param, index) => {
            const varName = param.escapedName!
            localVarMap.set(nonIndexedParams[index].escapedName!, varName)
            const mappedType = abiTypeConverter.mapAbiType(param)
            const parseLogic = TupleHandler.buildFieldParseLogic(
              `dataParts[${index}]`,
              param,
              mappedType,
              abiTypeConverter,
              importManager
            )
            lines.push(`    const ${varName}: ${mappedType} = ${parseLogic}`)
          })
        }
      }

      const constructorArgs = def.components.map((c) => localVarMap.get(c.escapedName!) || c.escapedName!).join(', ')
      lines.push(`    return new ${def.className}(${constructorArgs})`)
      lines.push(`  }`)

      lines.push(`}`)
      lines.push('')
    })

    return lines.join('\n')
  }
}
