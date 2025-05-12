import { getFunctionSelector } from '../../helpers'
import { AbiFunctionItem, AbiParameter, AssemblyTypes, InputType, InputTypeArray, LibTypes } from '../../types'

import { AbiTypeConverter } from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import { ImportManager } from './ImportManager'
import { TupleDefinition, TupleHandler } from './TupleHandler'

export class ClassGenerator {
  private importManager: ImportManager
  private tupleHandler: TupleHandler
  private abiTypeConverter: AbiTypeConverter

  constructor(importManager: ImportManager, tupleHandler: TupleHandler) {
    this.importManager = importManager
    this.tupleHandler = tupleHandler
    this.abiTypeConverter = new AbiTypeConverter(this.importManager, this.tupleHandler)
  }

  public generateTupleClassesCode(): string {
    const tupleDefinitions = this.tupleHandler.getDefinitions()
    if (tupleDefinitions.size === 0) return ''
    this.importManager.addType('parseCSV')

    const lines: string[] = []

    tupleDefinitions.forEach((def) => {
      lines.push(`export class ${def.className} {`)

      def.components.forEach((comp, index) => {
        const fieldName = comp.name || `field${index}`
        const componentType = this.abiTypeConverter.mapAbiType(comp)
        lines.push(`  readonly ${fieldName}: ${componentType}`)
      })

      lines.push('')

      const constructorParams = def.components
        .map((comp, index) => {
          const fieldName = comp.name || `field${index}`
          const componentType = this.abiTypeConverter.mapAbiType(comp)
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

      lines.push(...this._generateTupleParseMethodBody(def))

      const constructorArgs = def.components.map((comp, index) => `${comp.name || `field${index}`}`).join(', ')
      lines.push(`    return new ${def.className}(${constructorArgs})`)
      lines.push(`  }`)
      lines.push('')

      lines.push(`  toEvmCallParams(): EvmCallParam[] {`)
      this.importManager.addType('EvmCallParam')
      lines.push(`    return [`)
      lines.push(...this._generateTupleToEvmParamsMethodBody(def))
      lines.push(`    ]`)
      lines.push(`  }`)
      lines.push(`}`)
      lines.push('')
    })
    return lines.join('\n')
  }

  public generateContractClass(viewFunctions: AbiFunctionItem[], contractName: string): string {
    const lines: string[] = []
    this.appendClassDefinition(lines, contractName)
    viewFunctions.forEach((fn) => this.appendMethod(lines, fn))
    lines.push('}')
    return lines.join('\n')
  }

  private _generateParseArrayOfCustomObjectsCode(
    csvPartsVarName: string,
    itemIndex: number,
    fieldName: string,
    mappedComponentType: string,
    baseMappedType: string
  ): string {
    this.importManager.addType('parseCSV')
    return `    const ${fieldName}: ${mappedComponentType} = ${csvPartsVarName}[${itemIndex}] === '' ? [] : changetype<string[]>(parseCSV(${csvPartsVarName}[${itemIndex}])).map<${baseMappedType}>((item) => ${baseMappedType}._parse(item))`
  }

  private appendClassDefinition(lines: string[], contractName: string): void {
    this.importManager.addType(LibTypes.Address)

    lines.push(`export class ${contractName} {`)
    lines.push(`  private address: ${LibTypes.Address}`)
    this.importManager.addType(LibTypes.Address)
    lines.push(`  private chainId: ${AssemblyTypes.u64}`)
    lines.push(`  private timestamp: ${AssemblyTypes.Date} | null`)
    lines.push('')
    lines.push(
      `  constructor(address: ${LibTypes.Address}, chainId: ${AssemblyTypes.u64}, timestamp: ${AssemblyTypes.Date} | null = null) {`
    )
    lines.push(`    this.address = address`)
    lines.push(`    this.chainId = chainId`)
    lines.push(`    this.timestamp = timestamp`)
    lines.push(`  }`)
    lines.push('')
  }

  private appendMethod(lines: string[], fn: AbiFunctionItem): void {
    const inputs: AbiParameter[] = fn.inputs || []
    const methodParams = this.generateMethodParams(inputs)
    const returnType = this.determineReturnType(fn)
    lines.push(`  ${fn.name}(${methodParams}): ${returnType} {`)
    const callArgs = this.generateCallArguments(inputs)
    this.appendFunctionBody(lines, fn, returnType, callArgs)
    lines.push(`  }`)
    lines.push('')
  }

  private generateMethodParams(inputs: AbiParameter[]): string {
    return inputs
      .map((input, index) => {
        const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
        const type = this.abiTypeConverter.mapAbiType(input)
        return `${paramName}: ${type}`
      })
      .join(', ')
  }

  private determineReturnType(fn: AbiFunctionItem): InputType | InputTypeArray | 'void' | string {
    if (!fn.outputs || fn.outputs.length === 0) return 'void'

    if (fn.outputs.length === 1) return this.abiTypeConverter.mapAbiType(fn.outputs[0])

    let fnNamePart = fn.name.replace(/[^a-zA-Z0-9_]/g, '')
    if (!fnNamePart) fnNamePart = 'UnnamedFunction'
    fnNamePart = fnNamePart.charAt(0).toUpperCase() + fnNamePart.slice(1)
    const preferredName = `${fnNamePart}Outputs`

    const representativeOutputTuple: AbiParameter = {
      name: preferredName,
      type: 'tuple',
      internalType: `struct ${preferredName}`,
      components: fn.outputs,
    }

    const tupleClassName = this.tupleHandler.getClassNameForTupleDefinition(representativeOutputTuple)
    if (tupleClassName) return tupleClassName

    console.error(`Could not determine tuple class name for outputs of function ${fn.name}`)
    return 'unknown'
  }

  private generateEvmParam(input: AbiParameter, index: number): string {
    const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
    const paramType = this.abiTypeConverter.mapAbiType(input)
    this.importManager.addType('EvmCallParam')
    let abiType: string = input.type
    if (this.tupleHandler.isTupleType(input.type)) abiType = this.tupleHandler.mapTupleType(input.type)

    if (ArrayHandler.isArrayType(input.type)) {
      const baseAbiType = ArrayHandler.getBaseAbiType(input.type)

      const elementAbiParam: AbiParameter = {
        name: 'item',
        type: baseAbiType,
        components: this.tupleHandler.isTupleType(baseAbiType) ? input.components : undefined,
        internalType: input.internalType ? ArrayHandler.getBaseAbiType(input.internalType) : undefined,
      }

      const nestedEvmParam = this.generateEvmParam(elementAbiParam, 0)
      return `EvmCallParam.fromValues('${abiType}', ${paramName}.map<EvmCallParam>((${elementAbiParam.name}) => ${nestedEvmParam}))`
    }

    if (this.tupleHandler.isTupleType(input.type))
      return `EvmCallParam.fromValues('${abiType}', ${paramName}.toEvmCallParams())`
    return `EvmCallParam.fromValue('${abiType}', ${this.abiTypeConverter.toLibType(paramType, paramName)})`
  }

  private generateCallArguments(inputs: AbiParameter[]): string {
    return inputs
      .map((input, index) => {
        return this.generateEvmParam(input, index)
      })
      .join(', ')
  }

  private appendFunctionBody(
    lines: string[],
    fn: AbiFunctionItem,
    returnType: InputType | InputTypeArray | 'void' | string,
    callArgs: string
  ): void {
    const selector = getFunctionSelector(fn)
    this.importManager.addType('environment')
    const contractCallCode = `environment.contractCall(this.address, this.chainId, this.timestamp, '${selector}' ${callArgs ? `+ environment.evmEncode([${callArgs}])` : ''})`

    if (returnType === 'void') {
      lines.push(`    ${contractCallCode}`)
      return
    }

    this.importManager.addType('EvmDecodeParam')

    let decodeAbiTypeString: string
    if (fn.outputs && fn.outputs.length > 0) {
      if (fn.outputs.length === 1) {
        const singleOutput = fn.outputs[0]
        if (this.tupleHandler.isTupleType(singleOutput.type) && singleOutput.components) {
          decodeAbiTypeString = this.tupleHandler.generateTupleTypeString(singleOutput.type, singleOutput.components)
        } else {
          decodeAbiTypeString = singleOutput.type
        }
      } else {
        decodeAbiTypeString = this.tupleHandler.generateTupleTypeString('tuple', fn.outputs)
      }
    } else {
      decodeAbiTypeString = '()'
    }

    lines.push(`    const response = ${contractCallCode}`)
    lines.push(
      `    const decodedResponse = environment.evmDecode(new EvmDecodeParam('${decodeAbiTypeString}', response))`
    )

    const isReturnTypeArray = ArrayHandler.isArrayType(String(returnType))
    const baseReturnType = isReturnTypeArray
      ? String(returnType).substring(0, String(returnType).lastIndexOf('['))
      : String(returnType)

    const tupleDefinitions = this.tupleHandler.getDefinitions()
    const isBaseReturnTypeTupleClass = [...tupleDefinitions.values()].some((def) => def.className === baseReturnType)

    if (isBaseReturnTypeTupleClass) {
      if (isReturnTypeArray) {
        this.importManager.addType('parseCSV')
        lines.push(
          `    return decodedResponse === '' ? [] : changetype<string[]>(parseCSV(decodedResponse)).map<${baseReturnType}>((item) => ${baseReturnType}._parse(item))`
        )
      } else {
        lines.push(`    return ${baseReturnType}._parse(decodedResponse)`)
      }
    } else {
      if (isReturnTypeArray) {
        this.importManager.addType('parseCSV')
        const mapFunction = this.abiTypeConverter.generateTypeConversion(baseReturnType as InputType, 'value', true)
        lines.push(
          `    return decodedResponse === '' ? [] : changetype<string[]>(parseCSV(decodedResponse)).map<${baseReturnType}>(${mapFunction})`
        )
      } else {
        const returnLine = this.abiTypeConverter.generateTypeConversion(
          returnType as InputType,
          'decodedResponse',
          false
        )
        lines.push(`    ${returnLine}`)
      }
    }
  }

  private _generateTupleParseMethodBody(def: TupleDefinition): string[] {
    const parseLines = def.components.map((comp: AbiParameter, index: number) => {
      const fieldName = comp.name || `field${index}`
      const componentType = this.abiTypeConverter.mapAbiType(comp)

      const isAbiArray = ArrayHandler.isArrayType(comp.type)
      const abiBaseType = isAbiArray ? ArrayHandler.getBaseAbiType(comp.type) : ''

      if (isAbiArray && this.tupleHandler.isTupleType(abiBaseType)) {
        const mappedComponentTypeStr = String(componentType)
        const baseMappedType = mappedComponentTypeStr.substring(0, mappedComponentTypeStr.lastIndexOf('['))
        return this._generateParseArrayOfCustomObjectsCode(
          'parts',
          index,
          fieldName,
          mappedComponentTypeStr,
          baseMappedType
        )
      } else if (isAbiArray) {
        this.importManager.addType('parseCSV')
        let baseInternalType: string | undefined = undefined
        if (comp.internalType) {
          baseInternalType = ArrayHandler.isArrayType(comp.internalType)
            ? ArrayHandler.getBaseAbiType(comp.internalType)
            : comp.internalType
        }

        const baseCompAbiParameter: AbiParameter = {
          name: comp.name ? `${comp.name}_base` : `field${index}_base`,
          type: abiBaseType,
          internalType: baseInternalType,
          components: undefined,
        }
        const tsBaseType = this.abiTypeConverter.mapAbiType(baseCompAbiParameter)

        const elementConversionLogic = this.abiTypeConverter.generateTypeConversion(
          tsBaseType as InputType,
          'value',
          false,
          false
        )
        return `    const ${fieldName}: ${componentType} = parts[${index}] === '' ? [] : changetype<string[]>(parseCSV(parts[${index}])).map<${tsBaseType}>((value) => ${elementConversionLogic});`
      } else {
        const conversion = this.abiTypeConverter.generateTypeConversion(
          componentType as InputType,
          `parts[${index}]`,
          false,
          false
        )
        return `    const ${fieldName}: ${componentType} = ${conversion}`
      }
    })
    return parseLines
  }

  private _generateTupleToEvmParamsMethodBody(def: TupleDefinition): string[] {
    const paramLines: string[] = []
    def.components.forEach((comp: AbiParameter, index: number) => {
      const fieldName = comp.name || `field${index}`
      const componentType = this.abiTypeConverter.mapAbiType(comp)
      let paramCode: string

      if (this.tupleHandler.isTupleType(comp.type)) {
        const tupleType = this.tupleHandler.mapTupleType(comp.type)
        const isArray = ArrayHandler.isArrayType(tupleType)
        paramCode = `EvmCallParam.fromValues('${tupleType}', ${isArray ? `this.${fieldName}.map<EvmCallParam>((s) => EvmCallParam.fromValues(\'()\', s.toEvmCallParams()))` : `this.${fieldName}.toEvmCallParams()`})`
      } else {
        const convertedValue = this.abiTypeConverter.toLibType(componentType, `this.${fieldName}`)
        paramCode = `EvmCallParam.fromValue('${comp.type}', ${convertedValue})`
      }
      paramLines.push(`      ${paramCode},`)
    })
    return paramLines
  }
}
