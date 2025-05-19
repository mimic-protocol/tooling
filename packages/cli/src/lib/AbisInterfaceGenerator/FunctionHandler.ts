import { getFunctionSelector } from '../../helpers'
import type { AbiFunctionItem, AbiParameter } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import type ImportManager from './ImportManager'
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
    const inputs: AbiParameter[] = fn.inputs || []
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)

    lines.push(`  ${fn.name}(${methodParams}): ${returnType} {`)

    const callArgs = this.generateCallArguments(inputs, importManager, abiTypeConverter)
    this.appendFunctionBody(lines, fn, returnType, callArgs, importManager, abiTypeConverter)

    lines.push(`  }`)
    lines.push('')
  }

  public static getReturnType(
    fn: AbiFunctionItem,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
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
      .map((input, index) => {
        const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
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
      .map((input, index) => {
        const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
        return FunctionHandler.buildEvmEncodeParamCode(paramName, input, abiTypeConverter, importManager, 0)
      })
      .join(', ')
  }

  private static getDecodeAbiType(fn: AbiFunctionItem): string {
    if (fn.outputs && fn.outputs.length > 0) {
      if (fn.outputs.length === 1) {
        const output = fn.outputs[0]
        if (TupleHandler.isBaseTypeATuple(output.type) && output.components) {
          return TupleHandler.generateTupleTypeString(output.type, output.components)
        } else {
          return output.type
        }
      } else {
        return TupleHandler.generateTupleTypeString(TUPLE_ABI_TYPE, fn.outputs)
      }
    }
    return '()'
  }

  private static getReturnExpression(
    currentType: string,
    dataAccessString: string,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter,
    depth: number = 0
  ): string {
    if (ArrayHandler.isArrayType(currentType)) {
      importManager.addType('parseCSVNotNullable')
      const elementType = ArrayHandler.getArrayType(currentType)
      const itemVar = `item${depth}`

      const subLogic = this.getReturnExpression(elementType, itemVar, importManager, abiTypeConverter, depth + 1)
      return `${dataAccessString} === '' ? [] : parseCSVNotNullable(${dataAccessString}).map<${elementType}>(((${itemVar}: string) => ${subLogic}))`
    } else {
      return abiTypeConverter.generateTypeConversion(currentType, dataAccessString, false, false)
    }
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
    importManager.addType('environment')
    const contractCallCode = `environment.contractCall(this.address, this.chainId, this.timestamp, '${selector}' ${
      callArgs ? `+ environment.evmEncode([${callArgs}])` : ''
    })`

    if (returnType === 'void') {
      lines.push(`    ${contractCallCode}`)
      return
    }

    importManager.addType('EvmDecodeParam')
    const decodeAbiType = this.getDecodeAbiType(fn)

    lines.push(`    const response = ${contractCallCode}`)
    lines.push(`    const decodedResponse = environment.evmDecode(new EvmDecodeParam('${decodeAbiType}', response))`)

    const returnExpression = this.getReturnExpression(returnType, 'decodedResponse', importManager, abiTypeConverter)
    lines.push(`    return ${returnExpression}`)
  }
}
