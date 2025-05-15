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
      type: 'tuple',
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
    const abiType = TupleHandler.isBaseTypeATuple(input.type) ? TupleHandler.mapTupleType(input.type) : input.type

    if (ArrayHandler.isArrayType(input.type)) {
      const baseAbiType = ArrayHandler.getArrayAbiType(input.type)

      const elementAbiParam: AbiParameter = {
        name: 'item',
        type: baseAbiType,
        components: TupleHandler.isBaseTypeATuple(baseAbiType) ? input.components : undefined,
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

    if (TupleHandler.isBaseTypeATuple(input.type))
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
        return TupleHandler.generateTupleTypeString('tuple', fn.outputs)
      }
    }
    return '()'
  }

  private static getReturnParsingLogic(
    lines: string[],
    returnType: string,
    decodedResponseVarName: string,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter,
    tupleDefinitions: TupleDefinitionsMap
  ): void {
    const isArray = ArrayHandler.isArrayType(returnType)
    const baseType = isArray ? ArrayHandler.getBaseAbiType(returnType) : returnType

    if (isArray) {
      const parseExpression = this.buildArrayParseLogic(
        decodedResponseVarName,
        returnType,
        importManager,
        abiTypeConverter
      )
      lines.push(`    return ${parseExpression};`)
    } else if (TupleHandler.isTupleClassName(baseType, tupleDefinitions)) {
      lines.push(`    return ${baseType}._parse(${decodedResponseVarName})`)
    } else {
      const returnLine = abiTypeConverter.generateTypeConversion(returnType, decodedResponseVarName, false)
      lines.push(`    ${returnLine}`)
    }
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
    const decodeAbiType = this.getDecodeAbiType(fn)

    lines.push(`    const response = ${contractCallCode}`)
    lines.push(`    const decodedResponse = environment.evmDecode(new EvmDecodeParam('${decodeAbiType}', response))`)

    this.getReturnParsingLogic(lines, returnType, 'decodedResponse', importManager, abiTypeConverter, tupleDefinitions)
  }
}
