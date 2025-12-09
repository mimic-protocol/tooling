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
    if (this.isWriteFunction(fn)) return 'EvmCallBuilder'

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

    const isPayable = fn.stateMutability === 'payable'
    const fullMethodParams = methodParams.concat(
      isPayable ? `${methodParams.length > 0 ? ', ' : ''}value: ${LibTypes.BigInt}` : ''
    )

    lines.push(`  ${methodName}(${fullMethodParams}): ${returnType} {`)

    lines.push(
      `    const encodedData = ${contractName}Utils.encode${capitalizedName}(${inputs.map((p) => p.escapedName!).join(', ')})`
    )

    importManager.addType(LibTypes.Bytes)
    importManager.addType('EvmCallBuilder')
    if (isPayable) importManager.addType(LibTypes.BigInt)

    lines.push(
      `    return EvmCallBuilder.forChain(this._chainId).addCall(this._address, encodedData${isPayable ? ', value' : ''})`
    )

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

    importManager.addType('environment')
    importManager.addType('Result')

    const resultReturnType = returnType === 'void' ? 'Result<void, string>' : `Result<${returnType}, string>`
    lines.push(`  ${methodName}(${methodParams}): ${resultReturnType} {`)

    lines.push(
      `    const encodedData = ${contractName}Utils.encode${capitalizedName}(${inputs.map((p) => p.escapedName!).join(', ')})`
    )

    const contractCallLine = `environment.evmCallQuery(this._address, this._chainId, encodedData.toHexString(), this._timestamp)`

    if (returnType === 'void') {
      lines.push(`    const response = ${contractCallLine}`)
      lines.push(`    if (response.isError) return Result.err<void, string>(response.error)`)
      lines.push(`    return Result.ok<void, string>(changetype<void>(0))`)
    } else {
      lines.push(`    const response = ${contractCallLine}`)
      lines.push(`    if (response.isError) return Result.err<${returnType}, string>(response.error)`)
      lines.push(`    const decoded = ${contractName}Utils.decode${capitalizedName}(response.value)`)
      lines.push(`    return Result.ok<${returnType}, string>(decoded)`)
    }

    lines.push(`  }`)
    lines.push('')
  }
}
