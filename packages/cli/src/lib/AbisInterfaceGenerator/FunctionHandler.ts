import { type AbiFunctionItem, type AbiParameter, LibTypes } from '../../types'

import type AbiTypeConverter from './AbiTypeConverter'
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
    abiTypeConverter: AbiTypeConverter,
    contractName: string
  ): void {
    if (this.isWriteFunction(fn)) {
      this.appendWriteMethod(lines, fn, importManager, tupleDefinitions, abiTypeConverter, contractName)
      return
    }

    this.appendReadMethod(lines, fn, importManager, tupleDefinitions, abiTypeConverter, contractName)
  }

  public static getCapitalizedName(fn: AbiFunctionItem): string {
    const baseName = fn.escapedName || fn.name
    return `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`
  }

  public static isWriteFunction(fn: AbiFunctionItem): boolean {
    return ['nonpayable', 'payable'].includes(fn.stateMutability || '')
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

  public static generateMethodParams(inputs: AbiParameter[], abiTypeConverter: AbiTypeConverter): string {
    return inputs
      .map((input) => {
        const paramName = input.escapedName!
        const type = abiTypeConverter.mapAbiType(input)
        return `${paramName}: ${type}`
      })
      .join(', ')
  }

  private static appendWriteMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter,
    contractName: string
  ): void {
    const inputs = NameManager.resolveParameterNames(fn.inputs || [], NameContext.FUNCTION_PARAMETER, 'param')
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)

    const methodName = fn.escapedName || fn.name
    const capitalizedName = this.getCapitalizedName(fn)

    lines.push(`  ${methodName}(${methodParams}): ${returnType} {`)

    lines.push(
      `    const encodedData = ${contractName}Utils.encode${capitalizedName}(${inputs.map((p) => p.escapedName!).join(', ')})`
    )

    importManager.addType(LibTypes.Bytes)
    importManager.addType('CallBuilder')
    lines.push(`    return CallBuilder.forEvmChain(this._chainId).addCall(this._address, encodedData)`)

    lines.push(`  }`)
    lines.push('')
  }

  private static appendReadMethod(
    lines: string[],
    fn: AbiFunctionItem,
    importManager: ImportManager,
    tupleDefinitions: TupleDefinitionsMap,
    abiTypeConverter: AbiTypeConverter,
    contractName: string
  ): void {
    const inputs = NameManager.resolveParameterNames(fn.inputs || [], NameContext.FUNCTION_PARAMETER, 'param')
    const methodParams = this.generateMethodParams(inputs, abiTypeConverter)
    const returnType = this.getReturnType(fn, tupleDefinitions, abiTypeConverter)

    const methodName = fn.escapedName || fn.name
    const capitalizedName = this.getCapitalizedName(fn)

    lines.push(`  ${methodName}(${methodParams}): ${returnType} {`)

    lines.push(
      `    const encodedData = ${contractName}Utils.encode${capitalizedName}(${inputs.map((p) => p.escapedName!).join(', ')})`
    )

    importManager.addType('environment')
    const contractCallLine = `environment.contractCall(this._address, this._chainId, this._timestamp, encodedData.toHexString())`

    if (returnType === 'void') {
      lines.push(`    ${contractCallLine}`)
    } else {
      lines.push(`    const response = ${contractCallLine}`)
      lines.push(`    return ${contractName}Utils.decode${capitalizedName}(response)`)
    }

    lines.push(`  }`)
    lines.push('')
  }
}
