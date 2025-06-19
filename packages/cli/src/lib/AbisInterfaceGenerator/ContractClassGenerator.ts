import { type AbiFunctionItem, AssemblyPrimitiveTypes, LibTypes } from '../../types'

import AbiTypeConverter from './AbiTypeConverter'
import FunctionHandler from './FunctionHandler'
import ImportManager from './ImportManager'
import NameManager from './NameManager'
import TupleHandler from './TupleHandler'
import type { TupleDefinitionsMap } from './types'

export default class ContractClassGenerator {
  private abi: AbiFunctionItem[]
  private importManager: ImportManager
  private tupleDefinitions: TupleDefinitionsMap
  private abiTypeConverter: AbiTypeConverter

  constructor(abi: AbiFunctionItem[]) {
    this.abi = abi
    this.importManager = new ImportManager()
    this.tupleDefinitions = TupleHandler.extractTupleDefinitions(this.abi)
    this.abiTypeConverter = new AbiTypeConverter(this.importManager, this.tupleDefinitions)
  }

  public generate(contractName: string): string {
    const mainClassCode = this.generateMainClass(contractName)
    const tupleClassesCode = TupleHandler.generateTupleClassesCode(
      this.tupleDefinitions,
      this.importManager,
      this.abiTypeConverter
    )
    // Note: this should be generated after any other generation
    const importsCode = this.importManager.generateImportsCode()

    const separator = '\n\n'
    let result = importsCode + separator + mainClassCode
    if (tupleClassesCode) result += separator + tupleClassesCode

    return result.trim()
  }

  private generateMainClass(contractName: string): string {
    const lines: string[] = []
    this.appendClassDefinition(lines, contractName)

    const functions = NameManager.resolveMethodNames(this.getFunctions())

    functions.forEach((fn) =>
      FunctionHandler.appendMethod(lines, fn, this.importManager, this.tupleDefinitions, this.abiTypeConverter)
    )
    lines.push('}')
    return lines.join('\n')
  }

  private appendClassDefinition(lines: string[], contractName: string): void {
    this.importManager.addType(LibTypes.Address)
    this.importManager.addType(LibTypes.ChainId)
    this.importManager.addType(LibTypes.TokenAmount)

    lines.push(`export class ${contractName} {`)
    lines.push(`  private address: ${LibTypes.Address}`)
    lines.push(`  private chainId: ${LibTypes.ChainId}`)
    lines.push(`  private timestamp: ${AssemblyPrimitiveTypes.Date} | null`)
    lines.push(`  private feeTokenAmount: ${LibTypes.TokenAmount} | null`)
    lines.push('')
    lines.push(
      `  constructor(address: ${LibTypes.Address}, chainId: ${LibTypes.ChainId}, timestamp: ${AssemblyPrimitiveTypes.Date} | null = null, feeTokenAmount: ${LibTypes.TokenAmount} | null = null) {`
    )
    lines.push(`    this.address = address`)
    lines.push(`    this.chainId = chainId`)
    lines.push(`    this.timestamp = timestamp`)
    lines.push(`    this.feeTokenAmount = feeTokenAmount`)
    lines.push(`  }`)
    lines.push('')
  }

  private getFunctions(): AbiFunctionItem[] {
    return this.abi.filter((item) => item.type === 'function')
  }
}
