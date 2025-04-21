import { utils } from 'ethers'

import { AbiFunctionItem, AbiParameter, AssemblyTypes, InputType, InputTypeArray, LibTypes } from '../types'

type ImportedTypes = LibTypes | 'environment' | 'encodeCallData'

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

    const importedTypes = new Set<ImportedTypes>(['environment', 'encodeCallData', LibTypes.BigInt, LibTypes.Address])

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
  lines.push(`  private address: ${LibTypes.Address}`)
  lines.push(`  private chainId: ${AssemblyTypes.u64}`)
  lines.push(`  private timestamp: ${AssemblyTypes.Date} | null`)
  lines.push(``)
  lines.push(
    `  constructor(address: ${LibTypes.Address}, chainId: ${AssemblyTypes.u64}, timestamp: ${AssemblyTypes.Date} | null = null) {`
  )
  lines.push(`    this.address = address`)
  lines.push(`    this.chainId = chainId`)
  lines.push(`    this.timestamp = timestamp`)
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
          return `${LibTypes.Bytes}.fromBool(${paramName})`
        case AssemblyTypes.i8:
          importedTypes.add(LibTypes.Bytes)
          return `${LibTypes.Bytes}.fromI8(${paramName})`
        case AssemblyTypes.u8:
          importedTypes.add(LibTypes.Bytes)
          return `${LibTypes.Bytes}.fromU8(${paramName})`
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
  const functionSignature = `${fn.name}(${(fn.inputs || []).map((input) => input.type).join(',')})`
  const keccak256Selector = utils.id(functionSignature).slice(0, 10)

  const contractCallCode = `environment.contractCall(this.address, this.chainId, this.timestamp, encodeCallData('${keccak256Selector}', [${callArgs}]))`

  if (returnType === 'void') {
    lines.push(`    ${contractCallCode}`)
    return
  }

  lines.push(`    const result = ${contractCallCode}`)

  if (typeof returnType === 'string' && returnType.endsWith('[]')) {
    const baseType = returnType.slice(0, -2) as InputType
    const mapFunction = generateTypeConversion(baseType, 'value', true)
    lines.push(`    return result === '' ? [] : result.split(',').map(${mapFunction})`)
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
    case LibTypes.Address:
      conversion = `${type}.fromString(${valueVarName})`
      break
    case LibTypes.Bytes:
      conversion = `${type}.fromHexString(${valueVarName})`
      break
    case AssemblyTypes.i8:
    case AssemblyTypes.u8:
    case AssemblyTypes.bool:
      conversion = `${type}.parse(${valueVarName})`
      break
    default:
      conversion = valueVarName
      break
  }

  return isMapFunction ? `${valueVarName} => ${conversion}` : `return ${conversion}`
}

function generateIntegerTypeMappings(): Record<string, InputType> {
  const mappings: Record<string, InputType> = {
    int8: AssemblyTypes.i8,
    uint8: AssemblyTypes.u8,
    int: LibTypes.BigInt,
    uint: LibTypes.BigInt,
  }

  const START_BITS = 16
  const END_BITS = 256
  const STEP = 8

  for (let bits = START_BITS; bits <= END_BITS; bits += STEP) {
    mappings[`uint${bits}`] = LibTypes.BigInt
    mappings[`int${bits}`] = LibTypes.BigInt
  }

  return mappings
}

function generateBytesTypeMappings(): Record<string, InputType> {
  const mappings: Record<string, InputType> = {
    bytes: LibTypes.Bytes,
  }

  const MAX_SIZE = 32

  for (let size = 1; size <= MAX_SIZE; size++) {
    mappings[`bytes${size}`] = LibTypes.Bytes
  }

  return mappings
}
