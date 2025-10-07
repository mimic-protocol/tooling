import { getFunctionSelector } from '../../helpers'
import { type AbiFunctionItem, type AbiParameter, AssemblyPrimitiveTypes, LibTypes } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
import ArrayHandler from './ArrayHandler'
import type ImportManager from './ImportManager'
import NameManager, { NameContext } from './NameManager'
import TupleHandler from './TupleHandler'
import { TUPLE_ABI_TYPE, type TupleDefinitionsMap } from './types'

export default class UtilsHandler {
  public static generate(
    contractName: string,
    functions: AbiFunctionItem[],
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
    const methods: string[] = []

    functions.forEach((fn) => {
      methods.push(this.generateEncodeMethod(fn, importManager, abiTypeConverter))
      methods.push(this.generateDecodeMethod(fn, importManager, tupleDefinitions, abiTypeConverter))
    })

    const nonEmptyMethods = methods.filter((method) => method.trim() !== '')
    return `export class ${contractName}Utils {\n${nonEmptyMethods.join('\n')}\n}`
  }

  private static generateEncodeMethod(
    fn: AbiFunctionItem,
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): string {
    const inputs = NameManager.resolveParameterNames(fn.inputs || [], NameContext.FUNCTION_PARAMETER, 'param')
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const capitalizedName = this.getCapitalizedName(fn)

    importManager.addType(LibTypes.Bytes)
    const lines: string[] = []
    lines.push(`  static encode${capitalizedName}(${methodParams}): Bytes {`)

    const callArgs = this.generateCallArguments(inputs, importManager, abiTypeConverter)
    const selector = getFunctionSelector(fn)
    if (callArgs) importManager.addType('evm')

    const encodedCall = `'${selector}'${callArgs ? ` + evm.encode([${callArgs}])` : ''}`
    lines.push(`    return Bytes.fromHexString(${encodedCall})`)

    lines.push(`  }`)
    lines.push('')
    return lines.join('\n')
  }

  private static generateDecodeMethod(
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter
  ): string {
    const capitalizedName = this.getCapitalizedName(fn)

    // Skip decode method for write functions or void returns
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)
    if (this.isWriteFunction(fn) || returnType === 'void') return ''

    importManager.addType('EvmDecodeParam')
    importManager.addType('evm')

    const lines: string[] = []
    lines.push(`  static decode${capitalizedName}(encodedResponse: string): ${returnType} {`)

    const decodeAbiType = this.getDecodeAbiType(fn)
    lines.push(`    const decodedResponse = evm.decode(new EvmDecodeParam('${decodeAbiType}', encodedResponse))`)

    const returnExpression = this.getReturnExpression(returnType, 'decodedResponse', importManager, abiTypeConverter)
    lines.push(`    return ${returnExpression}`)

    lines.push(`  }`)
    lines.push('')
    return lines.join('\n')
  }

  private static getCapitalizedName(fn: AbiFunctionItem): string {
    const baseName = fn.escapedName || fn.name
    return `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`
  }

  private static isWriteFunction(fn: AbiFunctionItem): boolean {
    return ['nonpayable', 'payable'].includes(fn.stateMutability || '')
  }

  private static getReturnType(
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

  private static generateCallArguments(
    inputs: AbiParameter[],
    importManager: ImportManager,
    abiTypeConverter: AbiTypeConverter
  ): string {
    return inputs
      .map((input) => {
        const paramName = input.escapedName!
        return UtilsHandler.buildEvmEncodeParamCode(paramName, input, abiTypeConverter, importManager, 0)
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

      const nestedEvmParam = UtilsHandler.buildEvmEncodeParamCode(
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
}
