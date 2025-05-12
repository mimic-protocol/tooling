import { getFunctionSelector } from '../helpers'
import { AbiFunctionItem, AbiParameter, AssemblyTypes, InputType, InputTypeArray, LibTypes } from '../types'

type ImportedTypes = LibTypes | 'environment' | 'EvmCallParam' | 'parseCSV'

type TupleDefinition = {
  className: string
  components: AbiParameter[]
}

type TupleDefinitionsMap = Map<string, TupleDefinition>

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

    const importedTypes = new Set<ImportedTypes>(['environment', LibTypes.BigInt, LibTypes.Address, 'EvmCallParam'])
    const tupleDefinitions = extractTupleDefinitions(abi)

    const contractClassCode = generateContractClass(viewFunctions, contractName, importedTypes, tupleDefinitions)
    const tupleClassesCode = generateTupleClassesCode(tupleDefinitions, importedTypes)
    const importsCode = generateImports(importedTypes)

    return `${importsCode}\n\n${contractClassCode}\n\n${tupleClassesCode}`.trim()
  },
}

function filterViewFunctions(abi: AbiFunctionItem[]): AbiFunctionItem[] {
  return abi.filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability || ''))
}

function generateImports(importedTypes: Set<ImportedTypes>): string {
  return `import { ${[...importedTypes].sort().join(', ')} } from '@mimicprotocol/lib-ts'`
}

function extractTupleDefinitions(abi: AbiFunctionItem[]): TupleDefinitionsMap {
  const definitions: TupleDefinitionsMap = new Map()
  let tupleCounter = 0

  const processParam = (param: AbiParameter): string | undefined => {
    if (param.type !== 'tuple' || !param.components) return

    const existing = findMatchingDefinition(param, definitions)
    if (existing) return existing.className

    let className = `Tuple${tupleCounter++}`
    if (param.internalType) {
      const structMatch = param.internalType.match(/struct\s+(?:\w+\.)?(\w+)/)
      if (structMatch && structMatch[1]) {
        className = structMatch[1]
      }
    }

    const key = param.internalType || className

    definitions.set(key, {
      className,
      components: param.components,
    })

    param.components.forEach((subComp) => processParam(subComp))

    return className
  }

  abi.forEach((item) => {
    if (item.type !== 'function') return
    item.inputs?.forEach((input) => processParam(input))
    item.outputs?.forEach((output) => processParam(output))
  })

  return definitions
}

function findMatchingDefinition(param: AbiParameter, definitions: TupleDefinitionsMap): TupleDefinition | undefined {
  return [...definitions.values()].find(
    (def) =>
      def.components.length === param.components?.length &&
      def.components.every(
        (c, i) =>
          c.type === param.components?.[i].type &&
          (c.name === param.components?.[i].name || !c.name || !param.components?.[i].name)
      )
  )
}

function generateTupleClassesCode(tupleDefinitions: TupleDefinitionsMap, importedTypes: Set<ImportedTypes>): string {
  if (tupleDefinitions.size === 0) return ''
  importedTypes.add('parseCSV')

  const lines: string[] = []

  tupleDefinitions.forEach((def) => {
    lines.push(`export class ${def.className} {`)

    def.components.forEach((comp, index) => {
      const fieldName = comp.name || `field${index}`
      const componentType = mapAbiType(comp, importedTypes, tupleDefinitions)
      lines.push(`  readonly ${fieldName}: ${componentType}`)
    })

    lines.push('')

    const constructorParams = def.components
      .map((comp, index) => {
        const fieldName = comp.name || `field${index}`
        const componentType = mapAbiType(comp, importedTypes, tupleDefinitions)
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

    const parseLines = def.components.map((comp, index) => {
      const fieldName = comp.name || `field${index}`
      const componentType = mapAbiType(comp, importedTypes, tupleDefinitions)

      const conversion = generateTypeConversion(componentType as InputType, `parts[${index}]`, false, false)

      return `    const ${fieldName}_value: ${componentType} = ${conversion}`
    })

    lines.push(...parseLines)

    const constructorArgs = def.components.map((comp, index) => `${comp.name || `field${index}`}_value`).join(', ')

    lines.push(`    return new ${def.className}(${constructorArgs})`)
    lines.push(`  }`)
    lines.push('')

    lines.push(`  toEvmCallParams(): EvmCallParam[] {`)
    lines.push(`    return [`)

    def.components.forEach((comp, index) => {
      const fieldName = comp.name || `field${index}`
      const componentType = mapAbiType(comp, importedTypes, tupleDefinitions)

      let paramCode
      if (componentType.endsWith('_Tuple') || comp.type === 'tuple') {
        paramCode = `EvmCallParam.fromValues('${comp.type}', this.${fieldName}.toEvmCallParams())`
      } else {
        const convertedValue = toLibType(componentType, `this.${fieldName}`, importedTypes)
        paramCode = `EvmCallParam.fromValue('${comp.type}', ${convertedValue})`
      }

      lines.push(`      ${paramCode},`)
    })

    lines.push(`    ]`)
    lines.push(`  }`)

    lines.push(`}`)
    lines.push('')
  })

  return lines.join('\n')
}

function generateContractClass(
  viewFunctions: AbiFunctionItem[],
  contractName: string,
  importedTypes: Set<ImportedTypes>,
  tupleDefinitions: TupleDefinitionsMap
): string {
  const lines: string[] = []

  appendClassDefinition(lines, contractName)
  viewFunctions.forEach((fn) => appendMethod(lines, fn, importedTypes, tupleDefinitions))

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

function appendMethod(
  lines: string[],
  fn: AbiFunctionItem,
  importedTypes: Set<ImportedTypes>,
  tupleDefinitions: TupleDefinitionsMap
): void {
  const inputs: AbiParameter[] = fn.inputs || []
  const methodParams = generateMethodParams(inputs, importedTypes, tupleDefinitions)
  const returnType = determineReturnType(fn, importedTypes, tupleDefinitions)

  lines.push(`  ${fn.name}(${methodParams}): ${returnType} {`)

  const callArgs = generateCallArguments(inputs, importedTypes, tupleDefinitions)
  appendFunctionBody(lines, fn, returnType, callArgs, tupleDefinitions)

  lines.push(`  }`)
  lines.push(``)
}

function generateMethodParams(
  inputs: AbiParameter[],
  importedTypes: Set<ImportedTypes>,
  tupleDefinitions: TupleDefinitionsMap
): string {
  return inputs
    .map((input, index) => {
      const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
      const type = mapAbiType(input, importedTypes, tupleDefinitions)
      return `${paramName}: ${type}`
    })
    .join(', ')
}

function determineReturnType(
  fn: AbiFunctionItem,
  importedTypes: Set<ImportedTypes>,
  tupleDefinitions: TupleDefinitionsMap
): InputType | InputTypeArray | 'void' | string {
  if (!fn.outputs || fn.outputs.length === 0) return 'void'

  if (fn.outputs.length === 1) return mapAbiType(fn.outputs[0], importedTypes, tupleDefinitions)

  const firstOutputType = mapAbiType(fn.outputs[0], importedTypes, tupleDefinitions)
  const areAllSameType = fn.outputs.every(
    (output) => mapAbiType(output, importedTypes, tupleDefinitions) === firstOutputType
  )

  return areAllSameType ? (`${firstOutputType}[]` as InputTypeArray) : 'unknown[]'
}

function toLibType(
  paramType: InputType | InputTypeArray | string,
  paramName: string,
  importedTypes: Set<ImportedTypes>
): string {
  switch (paramType) {
    case AssemblyTypes.bool:
      importedTypes.add(LibTypes.Bytes)
      return `${LibTypes.Bytes}.fromBool(${paramName})`
    case AssemblyTypes.i8:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromI8(${paramName})`
    case AssemblyTypes.u8:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromU8(${paramName})`
    case AssemblyTypes.i16:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromI16(${paramName})`
    case AssemblyTypes.u16:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromU16(${paramName})`
    case AssemblyTypes.i32:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromI32(${paramName})`
    case AssemblyTypes.u32:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromU32(${paramName})`
    case AssemblyTypes.i64:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromI64(${paramName})`
    case AssemblyTypes.u64:
      importedTypes.add(LibTypes.BigInt)
      return `${LibTypes.BigInt}.fromU64(${paramName})`
    case AssemblyTypes.string:
      importedTypes.add(LibTypes.Bytes)
      return `${LibTypes.Bytes}.fromUTF8(${paramName})`
    default:
      return paramName
  }
}

function generateEvmParam(
  input: AbiParameter,
  importedTypes: Set<ImportedTypes>,
  index: number,
  tupleDefinitions: TupleDefinitionsMap
): string {
  const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
  const paramType = mapAbiType(input, importedTypes, tupleDefinitions)

  if (input.type.endsWith(']')) {
    const lastOpen = input.type.lastIndexOf('[')
    const base = input.type.slice(0, lastOpen)

    const lastOpenType = paramType.lastIndexOf('[')
    const baseType = paramType.slice(0, lastOpenType)
    return `EvmCallParam.fromValues('${input.type}', ${paramName}.map((x: ${baseType}) => ${generateEvmParam({ name: 'x', type: base, components: input.components }, importedTypes, 0, tupleDefinitions)}))`
  }

  if (input.type === 'tuple') {
    return `EvmCallParam.fromValues('()', ${paramName}.toEvmCallParams())`
  }

  return `EvmCallParam.fromValue('${input.type}', ${toLibType(paramType, paramName, importedTypes)})`
}

function generateCallArguments(
  inputs: AbiParameter[],
  importedTypes: Set<ImportedTypes>,
  tupleDefinitions: TupleDefinitionsMap
): string {
  return inputs
    .map((input, index) => {
      return generateEvmParam(input, importedTypes, index, tupleDefinitions)
    })
    .join(', ')
}

function appendFunctionBody(
  lines: string[],
  fn: AbiFunctionItem,
  returnType: InputType | InputTypeArray | 'void' | string,
  callArgs: string,
  tupleDefinitions: TupleDefinitionsMap
): void {
  const selector = getFunctionSelector(fn)
  const contractCallCode = `environment.contractCall(this.address, this.chainId, this.timestamp, '${selector}' ${callArgs ? `+ environment.evmEncode([${callArgs}])` : ''})`

  if (returnType === 'void') {
    lines.push(`    ${contractCallCode}`)
    return
  }

  lines.push(`    const result = ${contractCallCode}`)

  let isTupleClass = false
  if (typeof returnType === 'string') {
    tupleDefinitions.forEach((def) => {
      if (def.className === returnType) isTupleClass = true
    })
  }

  if (isTupleClass) {
    lines.push(`    return ${returnType}._parse(result)`)
    return
  }

  if (typeof returnType === 'string' && returnType.endsWith('[]')) {
    const baseType = returnType.slice(0, -2) as InputType
    const mapFunction = generateTypeConversion(baseType, 'value', true)
    lines.push(`    return result === '' ? [] : result.split(',').map<${baseType}>(${mapFunction})`)
  } else {
    const returnLine = generateTypeConversion(returnType as InputType, 'result', false)
    lines.push(`    ${returnLine}`)
  }
}

function mapAbiType(
  param: AbiParameter,
  importedTypes: Set<ImportedTypes>,
  tupleDefinitions: TupleDefinitionsMap
): InputType | InputTypeArray | string {
  const abiType = param.type

  if (abiType === 'tuple') {
    if (param.internalType) {
      for (const [key, def] of tupleDefinitions.entries()) {
        if (key === param.internalType) {
          return def.className
        }
      }
    }

    if (param.name) {
      for (const def of tupleDefinitions.values()) {
        if (def.className.includes(param.name) && def.className.endsWith('_Tuple')) {
          return def.className
        }
      }
    }

    if (param.components) {
      for (const def of tupleDefinitions.values()) {
        if (def.components.length === param.components.length) {
          let match = true
          for (let i = 0; i < def.components.length; i++) {
            if (def.components[i].type !== param.components[i].type) {
              match = false
              break
            }
          }
          if (match) return def.className
        }
      }
    }

    console.warn(`Unknown tuple type: ${param.type}`)
    return 'unknown'
  }

  if (abiType.endsWith(']')) {
    const lastIndex = abiType.lastIndexOf('[')
    const baseType = mapAbiType({ ...param, type: abiType.slice(0, lastIndex) }, importedTypes, tupleDefinitions)
    return `${baseType}[]` as InputTypeArray
  }

  const mapped = ABI_TYPECAST_MAP[abiType] || 'unknown'
  if (mapped === 'unknown') console.warn(`Unknown type: ${abiType}`)

  if (Object.values(LibTypes).includes(mapped as LibTypes)) {
    importedTypes.add(mapped as LibTypes)
  }

  return mapped
}

function generateTypeConversion(
  type: InputType,
  valueVarName: string,
  isMapFunction: boolean,
  includeReturn: boolean = true
): string {
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
    case AssemblyTypes.i16:
    case AssemblyTypes.u16:
    case AssemblyTypes.i32:
    case AssemblyTypes.u32:
    case AssemblyTypes.i64:
    case AssemblyTypes.u64:
      conversion = `${type}.parse(${valueVarName})`
      break
    case AssemblyTypes.bool:
      conversion = `${AssemblyTypes.u8}.parse(${valueVarName}) as ${AssemblyTypes.bool}`
      break
    default:
      conversion = valueVarName
      break
  }

  return isMapFunction ? `${valueVarName} => ${conversion}` : includeReturn ? `return ${conversion}` : conversion
}

function generateIntegerTypeMappings(): Record<string, InputType> {
  const mappings: Record<string, InputType> = {
    int8: AssemblyTypes.i8,
    uint8: AssemblyTypes.u8,
    int16: AssemblyTypes.i16,
    uint16: AssemblyTypes.u16,
    int32: AssemblyTypes.i32,
    uint32: AssemblyTypes.u32,
    int64: AssemblyTypes.i64,
    uint64: AssemblyTypes.u64,
    int: LibTypes.BigInt,
    uint: LibTypes.BigInt,
  }

  const START_BITS = 24
  const END_BITS = 256
  const STEP = 8

  for (let bits = START_BITS; bits <= END_BITS; bits += STEP) {
    if (!mappings[`int${bits}`]) mappings[`int${bits}`] = LibTypes.BigInt
    if (!mappings[`uint${bits}`]) mappings[`uint${bits}`] = LibTypes.BigInt
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
