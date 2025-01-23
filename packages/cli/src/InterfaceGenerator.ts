const ABI_TYPECAST_MAP: Record<string, string> = {
  uint256: 'BigInt',
  address: 'Address',
  bool: 'boolean',
  string: 'string',
  bytes: 'Bytes',
  'uint256[]': 'BigInt[]',
  'address[]': 'Address[]',
  'bytes32[]': 'Bytes[]',
  tuple: 'Bytes',
}

const mapAbiTypeToAsType = (type: string): string => {
  return ABI_TYPECAST_MAP[type] || 'unknown'
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
  outputs: Record<string, string>[]
): { declaration: string; tupleDefinitions: string[] } => {
  const tupleDefinitions: string[] = []
  const params = inputs
    .map((input, index) => {
      const paramName = input.name || `param${index}`
      if (input.type === 'tuple') {
        const tupleName = `${name}_${paramName}_Tuple`
        tupleDefinitions.push(generateTupleType(tupleName, input.components))
        return `${paramName}: ${tupleName}`
      }
      return `${paramName}: ${mapAbiTypeToAsType(input.type)}`
    })
    .join(', ')

  const returnType =
    outputs.length === 1
      ? mapAbiTypeToAsType(outputs[0].type)
      : outputs.length > 1
        ? `{ ${outputs.map((output, index) => `${output.name || `output${index}`}: ${mapAbiTypeToAsType(output.type)}`).join('; ')} }`
        : 'void'

  const declaration = `export function ${name}(${params}): ${returnType};`
  return { declaration, tupleDefinitions }
}

export const generateAbiInterface = (abi: Record<string, never>[], contractName: string): string => {
  const functions: string[] = []
  const tupleDefinitions: string[] = []

  abi
    .filter((item) => item.type === 'function')
    .forEach((item) => {
      const { declaration, tupleDefinitions: tuples } = generateFunctionWithTuple(
        item.name,
        item.inputs,
        item.outputs || []
      )
      functions.push(declaration)
      tupleDefinitions.push(...tuples)
    })

  const tupleDefinitionsOutput = tupleDefinitions.length > 0 ? `\n${tupleDefinitions.join('\n')}\n` : ''

  return `
${tupleDefinitionsOutput}export declare namespace ${contractName} {
  ${functions.join('\n  ')}
}`
}
