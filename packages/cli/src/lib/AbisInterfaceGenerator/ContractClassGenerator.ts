import { AbiFunctionItem, AssemblyPrimitiveTypes, LibTypes } from '../../types'

import { AbiTypeConverter } from './AbiTypeConverter'
import { FunctionHandler } from './FunctionHandler'
import { ImportManager } from './ImportManager'
import { TupleDefinitionsMap, TupleHandler } from './TupleHandler'

export class ContractClassGenerator {
  private importManager: ImportManager
  private tupleDefinitions: TupleDefinitionsMap
  private abiTypeConverter!: AbiTypeConverter

  constructor(importManager: ImportManager) {
    this.importManager = importManager
    this.tupleDefinitions = new Map()
  }

  public generateInterface(abi: AbiFunctionItem[], contractName: string): string {
    const viewFunctions = this.filterViewFunctions(abi)
    this.processAbi(abi)

    const contractClassCode = this.generateContractClass(viewFunctions, contractName)
    const tupleClassesCode = this.generateTupleClasses()
    const importsCode = this.importManager.generateImportsCode() // Note: this should be generated after any other generation

    const separator = '\n\n'
    let result = importsCode + separator + contractClassCode
    if (tupleClassesCode) result += separator + tupleClassesCode

    return result.trim()
  }

  public generateContractClass(viewFunctions: AbiFunctionItem[], contractName: string): string {
    const lines: string[] = []
    this.appendClassDefinition(lines, contractName)
    viewFunctions.forEach((fn) =>
      FunctionHandler.appendMethod(lines, fn, this.importManager, this.tupleDefinitions, this.abiTypeConverter)
    )
    lines.push('}')
    return lines.join('\n')
  }

  public processAbi(abi: AbiFunctionItem[]): void {
    this.tupleDefinitions = TupleHandler.extractTupleDefinitions(abi)
    this.abiTypeConverter = new AbiTypeConverter(this.importManager, this.tupleDefinitions)
  }

  public generateTupleClasses(): string {
    return TupleHandler.generateTupleClassesCode(this.tupleDefinitions, this.importManager, this.abiTypeConverter)
  }

  private appendClassDefinition(lines: string[], contractName: string): void {
    this.importManager.addType(LibTypes.Address)

    lines.push(`export class ${contractName} {`)
    lines.push(`  private address: ${LibTypes.Address}`)
    lines.push(`  private chainId: ${AssemblyPrimitiveTypes.u64}`)
    lines.push(`  private timestamp: ${AssemblyPrimitiveTypes.Date} | null`)
    lines.push('')
    lines.push(
      `  constructor(address: ${LibTypes.Address}, chainId: ${AssemblyPrimitiveTypes.u64}, timestamp: ${AssemblyPrimitiveTypes.Date} | null = null) {`
    )
    lines.push(`    this.address = address`)
    lines.push(`    this.chainId = chainId`)
    lines.push(`    this.timestamp = timestamp`)
    lines.push(`  }`)
    lines.push('')
  }

  private filterViewFunctions(abi: AbiFunctionItem[]): AbiFunctionItem[] {
    return abi.filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability || ''))
  }
}
