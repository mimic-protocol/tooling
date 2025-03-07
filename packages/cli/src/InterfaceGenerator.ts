import { AbiFunctionItem, AbiParameter, AssemblyTypes, InputType, InputTypeArray, LibTypes } from './types'

type ImportedTypes = LibTypes | 'environment'

const ABI_TYPECAST_MAP: Record<string, InputType> = {
  ...generateIntegerTypeMappings(),
  ...generateBytesTypeMappings(),
  address: LibTypes.Address,
  bool: AssemblyTypes.bool,
  string: AssemblyTypes.string,
} as const

export default {
  generate(abi: AbiFunctionItem[], contractName: string): string {
    const viewFunctions = filterViewFunctions(abi)

    if (viewFunctions.length === 0) return ''

    const importedTypes = new Set<ImportedTypes>()
    importedTypes.add('environment')

    const contractClassCode = generateContractClass(viewFunctions, contractName, importedTypes)
    const importsCode = generateImports(importedTypes)

    return `${importsCode}

${contractClassCode}`.trim()
  },
}

function filterViewFunctions(abi: AbiFunctionItem[]): AbiFunctionItem[] {
  return abi.filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability || ''))
}

function generateImports(importedTypes: Set<ImportedTypes>): string {
  return `import { ${[...importedTypes].sort().join(', ')} } from '@mimicprotocol/lib-ts'`
}

function generateContractClass(
  viewFunctions: AbiFunctionItem[],
  contractName: string,
  importedTypes: Set<ImportedTypes>
): string {
  const lines: string[] = []

  appendClassDefinition(lines, contractName)
  viewFunctions.forEach((fn) => appendMethod(lines, fn, importedTypes))

  lines.push('}')
  return lines.join('\n')
}

function appendClassDefinition(lines: string[], contractName: string): void {
  lines.push(`export class ${contractName} {`)
  lines.push(`  private address: Address;`)
  lines.push(`  private chainId: u64;`)
  lines.push(``)
  lines.push(`  constructor(address: Address, chainId: u64) {`)
  lines.push(`    this.address = address;`)
  lines.push(`    this.chainId = chainId;`)
  lines.push(`  }`)
  lines.push(``)
}

function appendMethod(lines: string[], fn: AbiFunctionItem, importedTypes: Set<ImportedTypes>): void {
  const inputs: AbiParameter[] = fn.inputs || []
  const methodParams = generateMethodParams(inputs, importedTypes)
  const returnType = determineReturnType(fn, importedTypes)

  lines.push(`  ${fn.name}(${methodParams}): ${returnType} {`)

  const callArgs = generateCallArguments(inputs, importedTypes)
  appendFunctionBody(lines, fn, returnType, callArgs)

  lines.push(`  }`)
  lines.push(``)
}

function generateMethodParams(inputs: AbiParameter[], importedTypes: Set<ImportedTypes>): string {
  return inputs
    .map((input, index) => {
      const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
      const type = mapAbiType(input.type, importedTypes)
      return `${paramName}: ${type}`
    })
    .join(', ')
}

function determineReturnType(
  fn: AbiFunctionItem,
  importedTypes: Set<ImportedTypes>
): InputType | InputTypeArray | 'void' {
  if (!fn.outputs || fn.outputs.length === 0) return 'void'

  if (fn.outputs.length === 1) return mapAbiType(fn.outputs[0].type, importedTypes)

  // Multiple outputs of the same type
  const firstOutputType = mapAbiType(fn.outputs[0].type, importedTypes)
  const areAllSameType = fn.outputs.every((output) => mapAbiType(output.type, importedTypes) === firstOutputType)

  return areAllSameType ? (`${firstOutputType}[]` as InputTypeArray) : 'unknown[]'
}

function generateCallArguments(inputs: AbiParameter[], importedTypes: Set<ImportedTypes>): string {
  return inputs
    .map((input, index) => {
      const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
      const paramType = mapAbiType(input.type, importedTypes)

      switch (paramType) {
        case LibTypes.BigInt:
          return `${paramName}.toBytes()`
        case AssemblyTypes.bool:
          importedTypes.add(LibTypes.Bytes)
          return `Bytes.fromBool(${paramName})`
        default:
          return paramName
      }
    })
    .join(', ')
}

function appendFunctionBody(
  lines: string[],
  fn: AbiFunctionItem,
  returnType: InputType | InputTypeArray | 'void',
  callArgs: string
): void {
  const contractCallCode = `environment.contractCall(this.address, this.chainId, '${fn.name}', [${callArgs}])`

  if (returnType === 'void') {
    lines.push(`    ${contractCallCode};`)
    return
  }

  lines.push(`    const result = ${contractCallCode};`)

  if (typeof returnType === 'string' && returnType.endsWith('[]')) {
    const baseType = returnType.slice(0, -2) as InputType
    const mapFunction = generateTypeConversion(baseType, 'value', true)
    lines.push(`    return result === '' ? [] : result.split(',').map(${mapFunction});`)
  } else {
    const returnLine = generateTypeConversion(returnType as InputType, 'result', false)
    lines.push(`    ${returnLine}`)
  }
}

function mapAbiType(abiType: string, importedTypes: Set<ImportedTypes>): InputType | InputTypeArray {
  if (abiType.endsWith('[]')) {
    const baseType = mapAbiType(abiType.slice(0, -2), importedTypes)
    return `${baseType}[]` as InputTypeArray
  }

  const mapped = ABI_TYPECAST_MAP[abiType] || 'unknown'

  if (Object.values(LibTypes).includes(mapped as LibTypes)) {
    importedTypes.add(mapped as LibTypes)
  }

  return mapped
}

function generateTypeConversion(type: InputType, valueVarName: string, isMapFunction: boolean): string {
  let conversion: string

  switch (type) {
    case LibTypes.BigInt:
      conversion = `BigInt.fromString(${valueVarName})`
      break
    case LibTypes.Address:
      conversion = `Address.fromString(${valueVarName})`
      break
    case LibTypes.Bytes:
      conversion = `Bytes.fromHexString(${valueVarName})`
      break
    case AssemblyTypes.bool:
      conversion = `${type}.parse(${valueVarName})`
      break
    default:
      conversion = valueVarName
      break
  }

  return isMapFunction ? `${valueVarName} => ${conversion}` : `return ${conversion};`
}

function generateIntegerTypeMappings(): Record<string, InputType> {
  const mappings: Record<string, InputType> = {
    int: LibTypes.BigInt,
    uint: LibTypes.BigInt,
  }

  for (let bits = 8; bits <= 256; bits += 8) {
    mappings[`uint${bits}`] = LibTypes.BigInt
    mappings[`int${bits}`] = LibTypes.BigInt
  }

  return mappings
}

function generateBytesTypeMappings(): Record<string, InputType> {
  const mappings: Record<string, InputType> = {
    bytes: LibTypes.Bytes,
  }

  for (let size = 1; size <= 32; size++) {
    mappings[`bytes${size}`] = LibTypes.Bytes
  }

  return mappings
}
