import { getFunctionSelector } from '../../helpers'
import { AbiFunctionItem, AbiParameter } from '../../types'

import { AbiTypeConverter } from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import { ImportManager } from './ImportManager'
import { TupleDefinitionsMap, TupleHandler } from './TupleHandler'

export class FunctionHandler {
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
    const callArgs = this.generateCallArguments(inputs, importManager, tupleDefinitions, abiTypeConverter)
    this.appendFunctionBody(lines, fn, returnType, callArgs, importManager, tupleDefinitions, abiTypeConverter)
    lines.push(`  }`)
    lines.push('')
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

  public static getReturnType(
    fn: AbiFunctionItem,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
    if (!fn.outputs || fn.outputs.length === 0) return 'void'

    if (fn.outputs.length === 1) return abiTypeConverter.mapAbiType(fn.outputs[0])

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

    const tupleClassName = TupleHandler.getClassNameForTupleDefinition(representativeOutputTuple, tupleDefinitions)
    if (tupleClassName) return tupleClassName

    console.error(`Could not determine tuple class name for outputs of function ${fn.name}`)
    return 'unknown'
  }

  private static generateEvmEncodeParam(
    input: AbiParameter,
    index: number,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
    const paramName = input.name && input.name.length > 0 ? input.name : `param${index}`
    const paramType = abiTypeConverter.mapAbiType(input)
    importManager.addType('EvmEncodeParam')
    let abiType: string = input.type
    if (TupleHandler.isTupleType(input.type)) abiType = TupleHandler.mapTupleType(input.type)

    if (ArrayHandler.isArrayType(input.type)) {
      const baseAbiType = ArrayHandler.getArrayAbiType(input.type)

      const elementAbiParam: AbiParameter = {
        name: 'item',
        type: baseAbiType,
        components: TupleHandler.isTupleType(baseAbiType) ? input.components : undefined,
        internalType: input.internalType ? ArrayHandler.getArrayAbiType(input.internalType) : undefined,
      }

      const nestedEvmParam = this.generateEvmEncodeParam(
        elementAbiParam,
        0,
        importManager,
        tupleDefinitions,
        abiTypeConverter
      )
      return `EvmEncodeParam.fromValues('${abiType}', ${paramName}.map<EvmEncodeParam>((${elementAbiParam.name}) => ${nestedEvmParam}))`
    }

    if (TupleHandler.isTupleType(input.type))
      return `EvmEncodeParam.fromValues('${abiType}', ${paramName}.toEvmEncodeParams())`
    return `EvmEncodeParam.fromValue('${abiType}', ${abiTypeConverter.toLibType(paramType, paramName)})`
  }

  private static generateCallArguments(
    inputs: AbiParameter[],
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
    return inputs
      .map((input, index) => {
        return this.generateEvmEncodeParam(input, index, importManager, tupleDefinitions, abiTypeConverter)
      })
      .join(', ')
  }

  private static buildArrayParseLogic(
    dataAccessString: string,
    currentType: string,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter,
    depth: number = 0
  ): string {
    importManager.addType('parseCSV')

    if (!ArrayHandler.isArrayType(currentType))
      return abiTypeConverter.generateTypeConversion(currentType, dataAccessString, false, false)

    const elementType = ArrayHandler.getArrayAbiType(currentType)
    const itemVar = `item${depth}`

    const subLogic = this.buildArrayParseLogic(itemVar, elementType, importManager, abiTypeConverter, depth + 1)

    return `${dataAccessString} === '' ? [] : changetype<string[]>(parseCSV(${dataAccessString})).map<${elementType}>(((${itemVar}: string) => ${subLogic}))`
  }

  private static appendFunctionBody(
    lines: string[],
    fn: AbiFunctionItem,
    returnType: string,
    callArgs: string,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
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

    let decodeAbiTypeString: string
    if (fn.outputs && fn.outputs.length > 0) {
      if (fn.outputs.length === 1) {
        const singleOutput = fn.outputs[0]
        if (TupleHandler.isTupleType(singleOutput.type) && singleOutput.components) {
          decodeAbiTypeString = TupleHandler.generateTupleTypeString(singleOutput.type, singleOutput.components)
        } else {
          decodeAbiTypeString = singleOutput.type
        }
      } else {
        decodeAbiTypeString = TupleHandler.generateTupleTypeString('tuple', fn.outputs)
      }
    } else {
      decodeAbiTypeString = '()'
    }

    lines.push(`    const response = ${contractCallCode}`)
    lines.push(
      `    const decodedResponse = environment.evmDecode(new EvmDecodeParam('${decodeAbiTypeString}', response))`
    )

    let baseType = returnType
    if (ArrayHandler.isArrayType(returnType)) baseType = ArrayHandler.getBaseAbiType(returnType)

    if (ArrayHandler.isArrayType(returnType)) {
      const parseExpression = this.buildArrayParseLogic('decodedResponse', returnType, importManager, abiTypeConverter)
      lines.push(`    return ${parseExpression};`)
    } else if (TupleHandler.isTupleType(baseType)) {
      lines.push(`    return ${baseType}._parse(decodedResponse)`)
    } else {
      const returnLine = abiTypeConverter.generateTypeConversion(returnType, 'decodedResponse', false)
      lines.push(`    ${returnLine}`)
    }
  }
}
