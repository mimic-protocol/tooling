import camelCase from 'lodash/camelCase'

import { AbiParameter } from './types'

const LIB_TYPES = ['BigInt', 'Address', 'Bytes', 'JSON'] as const
const PRIMITIVE_TYPES = ['u8', 'u16', 'u32', 'u64', 'i8', 'i16', 'i32', 'i64', 'boolean', 'string'] as const

const ABI_TYPECAST_MAP: Record<string, string> = {
  uint8: 'u8',
  uint16: 'u16',
  uint32: 'u32',
  uint64: 'u64',
  uint128: 'BigInt',
  uint256: 'BigInt',
  int8: 'i8',
  int16: 'i16',
  int32: 'i32',
  int64: 'i64',
  int128: 'BigInt',
  int256: 'BigInt',
  address: 'Address',
  bool: 'boolean',
  string: 'string',
  bytes: 'Bytes',
} as const

export default {
  generate(abi: Record<string, never>[], contractName: string): string {
    const viewFunctions = abi.filter(
      (item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability)
    )

    if (viewFunctions.length === 0) {
      return ''
    }

    const importedLibTypes = new Set<string>()
    importedLibTypes.add('JSON')

    const namespacePart = generateNamespace(viewFunctions, contractName)
    const contractClassPart = generateContractClass(viewFunctions, contractName, importedLibTypes)
    const paramsClassesPart = generateParamsClasses(viewFunctions, contractName, importedLibTypes)

    const importLine = `import { ${[...importedLibTypes].sort().join(', ')} } from '@mimicprotocol/lib-ts'`

    return `${importLine}

${namespacePart}

${contractClassPart}

${paramsClassesPart}`.trim()
  },
}

const toPascalCase = (str: string): string => camelCase(str).replace(/^(.)/, (_, c) => c.toUpperCase())

/**
 * Maps an ABI type to a TypeScript type using ABI_TYPECAST_MAP.
 * If it's an array ([] suffix), it processes recursively.
 * Tuple support is removed for now; in that case it returns 'unknown'.
 * Additionally, if the mapped type is in LIB_TYPES it's added to libTypes.
 */
const mapInputType = (
  abiType: string,
  input: AbiParameter | undefined,
  fnName: string | undefined,
  libTypes: Set<string>
): string => {
  if (abiType.endsWith('[]')) {
    return mapInputType(abiType.slice(0, -2), input, fnName, libTypes) + '[]'
  }
  if (abiType === 'tuple') {
    return 'unknown'
  }
  const mapped = ABI_TYPECAST_MAP[abiType] || 'unknown'
  if (LIB_TYPES.includes(mapped as (typeof LIB_TYPES)[number])) {
    libTypes.add(mapped)
  }
  return mapped
}

/**
 * Generates a namespace whose name is the lowercase contract name,
 * where functions that receive a JSON parameter are declared.
 */
const generateNamespace = (viewFunctions: Record<string, never>[], contractName: string): string => {
  const nsName = contractName.toLowerCase()
  const lines = [`declare namespace ${nsName} {`]
  viewFunctions.forEach((fn) => {
    lines.push(`  export function ${fn.name}(params: string): string;`)
  })
  lines.push(`}`)
  return lines.join('\n')
}

/**
 * Generates the contract class, which includes properties (address and chainId)
 * and methods for each view/pure function. Each method creates an instance of its
 * corresponding Params class and calls the namespace function.
 */
const generateContractClass = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewFunctions: Record<string, any>[],
  contractName: string,
  libTypes: Set<string>
): string => {
  const lines: string[] = []
  lines.push(`export class ${contractName} {`)
  lines.push(`  address: Address;`)
  lines.push(`  chainId: u64;`)
  lines.push(``)
  lines.push(`  constructor(address: Address, chainId: u64) {`)
  lines.push(`    this.address = address;`)
  lines.push(`    this.chainId = chainId;`)
  lines.push(`  }`)
  lines.push(``)
  viewFunctions.forEach((fn) => {
    const inputs: AbiParameter[] = fn.inputs || []
    const methodParams = inputs
      .map((input, index) => {
        const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
        const type = mapInputType(input.type, input, fn.name, libTypes)
        return `${paramName}: ${type}`
      })
      .join(', ')
    let retType = 'void'
    if (fn.outputs && fn.outputs.length === 1) {
      const outType = fn.outputs[0].type
      const mappedOut = mapInputType(outType, fn.outputs[0], fn.name, libTypes)
      retType = mappedOut === 'string' ? 'string' : mappedOut
    } else if (fn.outputs && fn.outputs.length > 1) {
    }
    lines.push(`  ${fn.name}(${methodParams}): ${retType} {`)
    const paramsClassName = `${contractName}${toPascalCase(fn.name)}Params`
    const constructorArgs = ['this.address', 'this.chainId']
      .concat(inputs.map((input, index) => (input.name && input.name.length > 0 ? input.name : `param${index}`)))
      .join(', ')
    const nsCall = `${contractName}.${fn.name}(JSON.stringify(new ${paramsClassName}(${constructorArgs})))`
    lines.push(`    const result = ${nsCall};`)

    let returnLine: string
    switch (retType) {
      case 'BigInt':
        returnLine = `return BigInt.fromString(result);`
        break
      case 'Address':
        returnLine = `return Address.fromString(result);`
        break
      case 'Bytes':
        returnLine = `return Bytes.fromHexString(result);`
        break
      case 'u8':
      case 'u16':
      case 'u32':
      case 'u64':
      case 'i8':
      case 'i16':
      case 'i32':
      case 'i64':
      case 'boolean':
        returnLine = `return JSON.parse<${retType}>(result);`
        break
      default:
        returnLine = `return result;`
        break
    }
    lines.push(`    ${returnLine}`)
    lines.push(`  }`)
    lines.push(``)
  })
  lines.push(`}`)
  return lines.join('\n')
}

/**
 * Generates parameter classes for each function, which extend from a base class.
 */
const generateParamsClasses = (
  viewFunctions: Record<string, never>[],
  contractName: string,
  libTypes: Set<string>
): string => {
  const lines: string[] = []
  if (viewFunctions.length > 0) {
    lines.push(`@json`)
    lines.push(`class ${contractName}BaseParams {`)
    lines.push(`  address: string;`)
    lines.push(`  chain_id: u64;`)
    lines.push(``)
    lines.push(`  constructor(address: Address, chainId: u64) {`)
    lines.push(`    this.address = address.toHexString();`)
    lines.push(`    this.chain_id = chainId;`)
    lines.push(`  }`)
    lines.push(`}`)
    lines.push(``)
  }
  viewFunctions.forEach((fn) => {
    const paramsClassName = `${contractName}${toPascalCase(fn.name)}Params`
    const inputs: AbiParameter[] = fn.inputs || []
    lines.push(`@json`)
    lines.push(`class ${paramsClassName} extends ${contractName}BaseParams {`)
    inputs.forEach((input) => {
      const fieldName = input.name && input.name.length > 0 ? input.name : 'param'
      const fieldType = mapInputType(input.type, input, fn.name, libTypes)
      const isPrimitive = PRIMITIVE_TYPES.includes(fieldType as never)
      lines.push(`  ${fieldName}: ${isPrimitive ? fieldType : 'string'};`)
    })
    lines.push(``)
    const constructorParams = ['address: Address', 'chainId: u64']
      .concat(
        inputs.map((input, index) => {
          const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
          return `${paramName}: ${mapInputType(input.type, input, fn.name, libTypes)}`
        })
      )
      .join(', ')
    lines.push(`  constructor(${constructorParams}) {`)
    lines.push(`    super(address, chainId);`)
    inputs.forEach((input) => {
      const fieldName = input.name && input.name.length > 0 ? input.name : 'param'
      const fieldType = mapInputType(input.type, input, fn.name, libTypes)
      const isPrimitive = PRIMITIVE_TYPES.includes(fieldType as never)
      if (isPrimitive) {
        lines.push(`    this.${fieldName} = ${fieldName};`)
      } else {
        lines.push(
          `    this.${fieldName} = ${fieldType === 'BigInt' ? `${fieldName}.toString()` : `${fieldName}.toHexString()`};`
        )
      }
    })
    lines.push(`  }`)
    lines.push(`}`)
    lines.push(``)
  })
  return lines.join('\n')
}
