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
      return 'Tuple[]' // Placeholder for dynamic tuple array generation
    }
    return `${mapAbiTypeToAsType(baseType)}[]`
  }
  const mappedType = ABI_TYPECAST_MAP[type] || 'unknown'
  if (LIB_TYPES.includes(mappedType)) {
    usedLibTypes.add(mappedType)
  }
  return mappedType
}

const generateTupleType = (name: string, components: Record<string, string>[]): string => {
  const fields = components.map((component) => `${component.name}: ${mapAbiTypeToAsType(component.type)};`).join('\n  ')

  return `
export class ${name} {
  ${fields}
}`
}

const generateFunctionWithTuple = (
  name: string,
  inputs: Record<string, never>[],
  outputs: Record<string, never>[]
): { declaration: string; tupleDefinitions: string[] } => {
  const tupleDefinitions: string[] = []

  const params = inputs
    .map((input, index) => {
      const paramName = input.name || `param${index}`
      if (input.type === 'tuple') {
        const tupleName = `${name}_${paramName}_Tuple`
        tupleDefinitions.push(generateTupleType(tupleName, input.components))
        return `${paramName}: ${tupleName}`
      } else if (input.type === 'tuple[]') {
        const tupleName = `${name}_${paramName}_Tuple`
        tupleDefinitions.push(generateTupleType(tupleName, input.components))
        return `${paramName}: ${tupleName}[]`
      }
      return `${paramName}: ${mapAbiTypeToAsType(input.type)}`
    })
    .join(', ')

  let returnType = 'void'
  if (outputs.length === 1) {
    if (outputs[0].type === 'tuple') {
      const tupleName = `${name}_Return_Tuple`
      tupleDefinitions.push(generateTupleType(tupleName, outputs[0].components))
      returnType = tupleName
    } else if (outputs[0].type === 'tuple[]') {
      const tupleName = `${name}_Return_Tuple`
      tupleDefinitions.push(generateTupleType(tupleName, outputs[0].components))
      returnType = `${tupleName}[]`
    } else {
      returnType = mapAbiTypeToAsType(outputs[0].type)
    }
  } else if (outputs.length > 1) {
    returnType = `{ ${outputs
      .map((output, index) => {
        if (output.type === 'tuple') {
          const tupleName = `${name}_Return${index}_Tuple`
          tupleDefinitions.push(generateTupleType(tupleName, output.components))
          return `${output.name || `output${index}`}: ${tupleName}`
        } else if (output.type === 'tuple[]') {
          const tupleName = `${name}_Return${index}_Tuple`
          tupleDefinitions.push(generateTupleType(tupleName, output.components))
          return `${output.name || `output${index}`}: ${tupleName}[]`
        }
        return `${output.name || `output${index}`}: ${mapAbiTypeToAsType(output.type)}`
      })
      .join('; ')} }`
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
