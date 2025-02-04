import camelCase from 'lodash/camelCase'

type AbiParameter = {
  name?: string
  type: string
  components?: Array<{ name: string; type: string }>
}

type GenerateResult = {
  declaration: string
  tupleDefinitions: string[]
}

type LibTypesSet = Set<string>

const LIB_TYPES = ['BigInt', 'Address', 'Bytes']

export default {
  generate(abi: Record<string, never>[], contractName: string): string {
    const importedLibTypes: LibTypesSet = new Set()
    const functionDeclarations: string[] = []
    const tupleDefinitions: string[] = []

    abi
      .filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability))
      .forEach((item) => {
        const { declaration, tupleDefinitions: tuples } = generateFunctionWithTuple(
          item.name,
          item.inputs,
          item.outputs || [],
          importedLibTypes
        )
        functionDeclarations.push(declaration)
        tupleDefinitions.push(...tuples)
      })

    if (functionDeclarations.length === 0) return ''

    const importLine =
      importedLibTypes.size > 0
        ? `import { ${[...importedLibTypes].sort().join(', ')} } from '@mimicprotocol/lib-ts'`
        : ''

    const tuplesOutput = tupleDefinitions.length > 0 ? `\n${tupleDefinitions.join('\n')}\n` : ''

    return `${importLine}${tuplesOutput}
export declare namespace ${contractName} {
  ${functionDeclarations.join('\n  ')}
}`.trim()
  },
}

const toPascalCase = (str: string): string => camelCase(str).replace(/^(.)/, (_, c) => c.toUpperCase())

const ABI_TYPECAST_MAP: Record<string, string> = {
  uint8: 'BigInt',
  uint16: 'BigInt',
  uint32: 'BigInt',
  uint64: 'BigInt',
  uint128: 'BigInt',
  uint256: 'BigInt',
  int8: 'BigInt',
  int16: 'BigInt',
  int32: 'BigInt',
  int64: 'BigInt',
  int128: 'BigInt',
  int256: 'BigInt',
  address: 'Address',
  bool: 'boolean',
  string: 'string',
  bytes: 'Bytes',
} as const

const mapAbiType = (abiType: string, libTypes: LibTypesSet): string => {
  if (abiType.endsWith('[]')) {
    const baseType = abiType.slice(0, -2)
    return baseType === 'tuple' ? 'Tuple[]' : `${mapAbiType(baseType, libTypes)}[]`
  }
  const mapped = ABI_TYPECAST_MAP[abiType] || 'unknown'
  if (LIB_TYPES.includes(mapped)) libTypes.add(mapped)
  return mapped
}

const createTupleDefinition = (
  name: string,
  components: Array<{ name: string; type: string }>,
  libTypes: LibTypesSet
): string => {
  const fields = components
    .map((component) => `${component.name}: ${mapAbiType(component.type, libTypes)};`)
    .join('\n  ')
  return `
export class ${name} {
  ${fields}
}`
}

const generateFunctionWithTuple = (
  functionName: string,
  inputs: AbiParameter[],
  outputs: AbiParameter[],
  libTypes: LibTypesSet
): GenerateResult => {
  const tupleDefs: string[] = []

  const resolveParamType = (param: AbiParameter, suffix: string): string => {
    if (param.type === 'tuple' || param.type === 'tuple[]') {
      const isArray = param.type.endsWith('[]')
      const tupleName = toPascalCase(`${functionName}_${suffix}_Tuple`)
      if (param.components) {
        tupleDefs.push(createTupleDefinition(tupleName, param.components, libTypes))
      }
      return isArray ? `${tupleName}[]` : tupleName
    }
    return mapAbiType(param.type, libTypes)
  }

  const parameters = inputs
    .map((input, index) => {
      const paramName = input.name || `param${index}`
      return `${paramName}: ${resolveParamType(input, paramName)}`
    })
    .join(', ')

  let returnType = 'void'
  if (outputs.length === 1) {
    const output = outputs[0]
    if (output.type === 'tuple' || output.type === 'tuple[]') {
      const tupleName = toPascalCase(`${functionName}_Return_Tuple`)
      if (output.components) {
        tupleDefs.push(createTupleDefinition(tupleName, output.components, libTypes))
      }
      returnType = output.type === 'tuple[]' ? `${tupleName}[]` : tupleName
    } else {
      returnType = mapAbiType(output.type, libTypes)
    }
  } else if (outputs.length > 1) {
    const fields = outputs
      .map((output, index) => {
        const outputName = output.name || `output${index}`
        return `${outputName}: ${resolveParamType(output, `Return${index}`)}`
      })
      .join('; ')
    returnType = `{ ${fields} }`
  }

  const declaration = `export function ${functionName}(${parameters}): ${returnType};`
  return { declaration, tupleDefinitions: tupleDefs }
}
