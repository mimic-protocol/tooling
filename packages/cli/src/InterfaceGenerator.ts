import camelCase from 'lodash/camelCase'

function toCamelCase(str: string): string {
  const camelCaseStr = camelCase(str)
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1)
}

const ABI_TYPECAST_MAP: Record<string, string> = {
  uint256: 'BigInt',
  address: 'Address',
  bool: 'boolean',
  string: 'string',
  bytes: 'Bytes',
} as const

const LIB_TYPES = ['BigInt', 'Address', 'Bytes']
const usedLibTypes = new Set<string>()

const mapAbiTypeToAsType = (type: string): string => {
  if (type.endsWith('[]')) {
    const baseType = type.slice(0, -2)
    if (baseType === 'tuple') {
      return 'Tuple[]' // Placeholder
    }
    return `${mapAbiTypeToAsType(baseType)}[]`
  }
  const mappedType = ABI_TYPECAST_MAP[type] || 'unknown'
  if (LIB_TYPES.includes(mappedType)) {
    usedLibTypes.add(mappedType)
  }
  return mappedType
}

const generateTupleType = (name: string, components: { name: string; type: string }[]): string => {
  const fields = components.map((component) => `${component.name}: ${mapAbiTypeToAsType(component.type)};`).join('\n  ')

  return `
export class ${name} {
  ${fields}
}`
}

const generateFunctionWithTuple = (
  name: string,
  inputs: { name?: string; type: string; components?: { name: string; type: string }[] }[],
  outputs: { name?: string; type: string; components?: { name: string; type: string }[] }[]
): { declaration: string; tupleDefinitions: string[] } => {
  const tupleDefinitions: string[] = []

  const resolveType = (
    item: { name?: string; type: string; components?: { name: string; type: string }[] },
    suffix: string
  ): string => {
    if (item.type === 'tuple' || item.type === 'tuple[]') {
      const isArray = item.type.endsWith('[]')
      const tupleName = toCamelCase(`${name}_${suffix}_Tuple`)
      if (item.components) {
        tupleDefinitions.push(generateTupleType(tupleName, item.components))
      }
      return isArray ? `${tupleName}[]` : tupleName
    }
    return mapAbiTypeToAsType(item.type)
  }

  const params = inputs
    .map((input, index) => {
      const paramName = input.name || `param${index}`
      const typeStr = resolveType(input, paramName)
      return `${paramName}: ${typeStr}`
    })
    .join(', ')

  let returnType = 'void'
  if (outputs.length === 1) {
    const output = outputs[0]
    if (output.type === 'tuple' || output.type === 'tuple[]') {
      const tupleName = toCamelCase(`${name}_Return_Tuple`)
      if (output.components) {
        tupleDefinitions.push(generateTupleType(tupleName, output.components))
      }
      returnType = output.type === 'tuple[]' ? `${tupleName}[]` : tupleName
    } else {
      returnType = mapAbiTypeToAsType(output.type)
    }
  } else if (outputs.length > 1) {
    const fields = outputs
      .map((output, index) => {
        const outName = output.name || `output${index}`
        const typeStr = resolveType(output, `Return${index}`)
        return `${outName}: ${typeStr}`
      })
      .join('; ')
    returnType = `{ ${fields} }`
  }

  const declaration = `export function ${name}(${params}): ${returnType};`
  return { declaration, tupleDefinitions }
}

export const generateAbiInterface = (abi: Record<string, never>[], contractName: string): string => {
  const functions: string[] = []
  const tupleDefinitions: string[] = []

  abi
    .filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability))
    .forEach((item) => {
      const { declaration, tupleDefinitions: tuples } = generateFunctionWithTuple(
        item.name,
        item.inputs,
        item.outputs || []
      )
      functions.push(declaration)
      tupleDefinitions.push(...tuples)
    })

  if (functions.length === 0) {
    return ''
  }

  const imports =
    usedLibTypes.size > 0 ? `import { ${[...usedLibTypes].sort().join(', ')} } from '@mimicprotocol/lib-ts'` : ''

  const tupleDefinitionsOutput = tupleDefinitions.length > 0 ? `\n${tupleDefinitions.join('\n')}\n` : ''

  return `
${imports}${tupleDefinitionsOutput}
export declare namespace ${contractName} {
  ${functions.join('\n  ')}
}`.trim()
}
