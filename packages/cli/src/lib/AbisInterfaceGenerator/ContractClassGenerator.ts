import { AbiFunctionItem, AssemblyTypes, LibTypes } from '../../types'

import { AbiTypeConverter } from './AbiTypeConverter'
import { FunctionHandler } from './FunctionHandler'
import { ImportManager } from './ImportManager'
import { TupleDefinitionsMap, TupleHandler } from './TupleHandler'

export class ContractClassGenerator {
  private importManager: ImportManager
  private tupleDefinitions: TupleDefinitionsMap
  private abiTypeConverter: AbiTypeConverter

  constructor(importManager: ImportManager) {
    this.importManager = importManager
    this.tupleDefinitions = new Map()
    this.abiTypeConverter = new AbiTypeConverter(this.importManager, this.tupleDefinitions)
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
}
