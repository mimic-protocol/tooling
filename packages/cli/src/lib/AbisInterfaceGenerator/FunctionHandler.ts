import { getFunctionSelector } from '../../helpers'
import { type AbiFunctionItem, type AbiParameter, AssemblyPrimitiveTypes, LibTypes } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import type ImportManager from './ImportManager'
import NameManager, { NameContext } from './NameManager'
import TupleHandler from './TupleHandler'
import { TUPLE_ABI_TYPE, type TupleDefinitionsMap } from './types'

export default class FunctionHandler {
  public static appendMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): void {
    this.appendEncodeMethod(lines, fn, importManager, abiTypeConverter)

    if (this.isWriteFunction(fn)) {
      this.appendWriteMethod(lines, fn, importManager, tupleDefinitions, abiTypeConverter)
      return
    }

    this.appendDecodeMethod(lines, fn, importManager, tupleDefinitions, abiTypeConverter)
    this.appendReadMethod(lines, fn, importManager, tupleDefinitions, abiTypeConverter)
  }

  private static getCapitalizedName(fn: AbiFunctionItem): string {
    const baseName = fn.escapedName || fn.name
    return `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`
  }

  private static appendWriteMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): void {
    const inputs = NameManager.resolveParameterNames(fn.inputs || [], NameContext.FUNCTION_PARAMETER, 'param')
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)

    const methodName = fn.escapedName || fn.name
    const capitalizedName = this.getCapitalizedName(fn)

    lines.push(`  ${methodName}(${methodParams}): ${returnType} {`)

    lines.push(
      `    const encodedData = this._encode${capitalizedName}(${inputs.map((p) => p.escapedName!).join(', ')})`
    )

    importManager.addType(LibTypes.Bytes)
    importManager.addType('CallBuilder')
    lines.push(`    return CallBuilder.forChain(this._chainId).addCall(this._address, encodedData)`)

    lines.push(`  }`)
    lines.push('')
  }

  private static appendEncodeMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): void {
    const inputs = NameManager.resolveParameterNames(fn.inputs || [], NameContext.FUNCTION_PARAMETER, 'param')
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const capitalizedName = this.getCapitalizedName(fn)

    importManager.addType(LibTypes.Bytes)
    lines.push(`  _encode${capitalizedName}(${methodParams}): Bytes {`)

    const callArgs = this.generateCallArguments(inputs, importManager, abiTypeConverter)
    const selector = getFunctionSelector(fn)
    if (callArgs) importManager.addType('evm')

    const encodedCall = `'${selector}'${callArgs ? ` + evm.encode([${callArgs}])` : ''}`
    lines.push(`    return Bytes.fromHexString(${encodedCall})`)

    lines.push(`  }`)
    lines.push('')
  }

  private static appendDecodeMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): void {
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)
    if (returnType === 'void') return // No decode method needed for void functions

    const capitalizedName = this.getCapitalizedName(fn)
    importManager.addType('EvmDecodeParam')
    importManager.addType('evm')

    lines.push(`  _decode${capitalizedName}(encodedResponse: string): ${returnType} {`)

    const decodeAbiType = this.getDecodeAbiType(fn)
    lines.push(`    const decodedResponse = evm.decode(new EvmDecodeParam('${decodeAbiType}', encodedResponse))`)

    const returnExpression = this.getReturnExpression(returnType, 'decodedResponse', importManager, abiTypeConverter)
    lines.push(`    return ${returnExpression}`)

    lines.push(`  }`)
    lines.push('')
  }

  private static appendReadMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): void {
    const inputs = NameManager.resolveParameterNames(fn.inputs || [], NameContext.FUNCTION_PARAMETER, 'param')
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)

    const methodName = fn.escapedName || fn.name
    const capitalizedName = this.getCapitalizedName(fn)

    lines.push(`  ${methodName}(${methodParams}): ${returnType} {`)

    lines.push(
      `    const encodedData = this._encode${capitalizedName}(${inputs.map((p) => p.escapedName!).join(', ')})`
    )

    importManager.addType('environment')
    const contractCallLine = `environment.contractCall(this._address, this._chainId, this._timestamp, encodedData.toHexString())`

    if (returnType === 'void') {
      lines.push(`    ${contractCallLine}`)
    } else {
      lines.push(`    const response = ${contractCallLine}`)
      lines.push(`    return this._decode${capitalizedName}(response)`)
    }

    lines.push(`  }`)
    lines.push('')
  }

  public static getReturnType(
    fn: AbiFunctionItem,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
    if (this.isWriteFunction(fn)) return 'CallBuilder'

    if (!fn.outputs || fn.outputs.length === 0) return 'void'

    if (fn.outputs.length === 1) return abiTypeConverter.mapAbiType(fn.outputs[0])

    const name = TupleHandler.getOutputTupleClassName(fn.name)

    const representativeOutputTuple: AbiParameter = {
      name,
      type: TUPLE_ABI_TYPE,
      internalType: `struct ${name}`,
      components: fn.outputs,
    }

    const tupleClassName = TupleHandler.getClassNameForTupleDefinition(representativeOutputTuple, tupleDefinitions)
    if (tupleClassName) return tupleClassName

    console.error(`Could not determine tuple class name for outputs of function ${fn.name}`)
    return 'unknown'
  }

  private static generateMethodParams(inputs: AbiParameter[], abiTypeConverter: AbiTypeConverter): string {
    return inputs
      .map((input) => {
        const paramName = input.escapedName!
        const type = abiTypeConverter.mapAbiType(input)
        return `${paramName}: ${type}`
      })
      .join(', ')
  }

  public static buildEvmEncodeParamCode(
    valueIdentifier: string,
    paramDefinition: AbiParameter,
    abiTypeConverter: AbiTypeConverter,
    importManager: ImportManager,
    depth: number = 0
  ): string {
    importManager.addType('EvmEncodeParam')
    const currentAbiTypeSignature = TupleHandler.isBaseTypeATuple(paramDefinition.type)
      ? TupleHandler.mapTupleType(paramDefinition.type)
      : paramDefinition.type

    if (ArrayHandler.isArrayType(paramDefinition.type)) {
      const elementLambdaVar = `s${depth}`

      const elementAbiDefinition: AbiParameter = {
        name: elementLambdaVar,
        type: ArrayHandler.getArrayType(paramDefinition.type),
        components: TupleHandler.isBaseTypeATuple(ArrayHandler.getArrayType(paramDefinition.type))
          ? paramDefinition.components
          : undefined,
        internalType: paramDefinition.internalType
          ? ArrayHandler.getArrayType(paramDefinition.internalType)
          : undefined,
      }

      const nestedEvmParam = FunctionHandler.buildEvmEncodeParamCode(
        elementLambdaVar,
        elementAbiDefinition,
        abiTypeConverter,
        importManager,
        depth + 1
      )
      return `EvmEncodeParam.fromValues('${currentAbiTypeSignature}', ${valueIdentifier}.map<EvmEncodeParam>((${elementLambdaVar}) => ${nestedEvmParam}))`
    }

    if (TupleHandler.isBaseTypeATuple(paramDefinition.type)) {
      return `EvmEncodeParam.fromValues('${currentAbiTypeSignature}', ${valueIdentifier}.toEvmEncodeParams())`
    }

    const mappedParamType = abiTypeConverter.mapAbiType(paramDefinition)
    const convertedValue = abiTypeConverter.toLibType(mappedParamType, valueIdentifier)
    return `EvmEncodeParam.fromValue('${currentAbiTypeSignature}', ${convertedValue})`
  }

  private static generateCallArguments(
    inputs: AbiParameter[],
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): string {
    return inputs
      .map((input) => {
        const paramName = input.escapedName!
        return FunctionHandler.buildEvmEncodeParamCode(paramName, input, abiTypeConverter, importManager, 0)
      })
      .join(', ')
  }

  private static getDecodeAbiType(fn: AbiFunctionItem): string {
    const outputs = fn.outputs ?? []

    if (outputs.length === 0) return '()'

    if (outputs.length === 1) {
      const [output] = outputs
      const { type, components } = output

      if (TupleHandler.isBaseTypeATuple(type) && components)
        return TupleHandler.generateTupleTypeString(type, components)

      return type
    }

    return TupleHandler.generateTupleTypeString(TUPLE_ABI_TYPE, outputs)
  }

  private static getReturnExpression(
    currentType: string,
    dataAccessString: string,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter,
    depth: number = 0
  ): string {
    if (ArrayHandler.isArrayType(currentType)) {
      importManager.addType('JSON')
      const elementType = ArrayHandler.getArrayType(currentType)
      const itemVar = `item${depth}`

      const subLogic = this.getReturnExpression(elementType, itemVar, importManager, abiTypeConverter, depth + 1)
      return `${dataAccessString} === '' ? [] : JSON.parse<${AssemblyPrimitiveTypes.string}[]>(${dataAccessString}).map<${elementType}>(((${itemVar}: ${AssemblyPrimitiveTypes.string}) => ${subLogic}))`
    }

    return abiTypeConverter.generateTypeConversion(currentType, dataAccessString, false, false)
  }

  private static appendFunctionBody(
    lines: string[],
    fn: AbiFunctionItem,
    returnType: string,
    callArgs: string,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): void {
    const selector = getFunctionSelector(fn)
    if (callArgs) importManager.addType('evm')

    const encodedCall = `'${selector}'${callArgs ? ` + evm.encode([${callArgs}])` : ''}`

    if (this.isWriteFunction(fn)) {
      importManager.addType(LibTypes.Bytes)
      importManager.addType('CallBuilder')
      lines.push(`    const encodedData = Bytes.fromHexString(${encodedCall})`)
      lines.push(`    return CallBuilder.forChain(this._chainId).addCall(this._address, encodedData)`)
      return
    }

    importManager.addType('environment')
    const contractCallCode = `environment.contractCall(this._address, this._chainId, this._timestamp, ${encodedCall})`

    if (returnType === 'void') {
      lines.push(`    ${contractCallCode}`)
      return
    }

    importManager.addType('EvmDecodeParam')
    const decodeAbiType = this.getDecodeAbiType(fn)

    lines.push(`    const response = ${contractCallCode}`)
    lines.push(`    const decodedResponse = evm.decode(new EvmDecodeParam('${decodeAbiType}', response))`)

    const returnExpression = this.getReturnExpression(returnType, 'decodedResponse', importManager, abiTypeConverter)
    lines.push(`    return ${returnExpression}`)
  }

  private static isWriteFunction(fn: AbiFunctionItem): boolean {
    return ['nonpayable', 'payable'].includes(fn.stateMutability || '')
  }
}
