import { AbiFunctionItem, AssemblyPrimitiveTypes, LibTypes } from '../../types'

import { AbiTypeConverter } from './AbiTypeConverter'
import { FunctionHandler } from './FunctionHandler'
import { ImportManager } from './ImportManager'
import { TupleDefinitionsMap, TupleHandler } from './TupleHandler'

export class ContractClassGenerator {
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
    this.getViewFunctions().forEach((fn) =>
      FunctionHandler.appendMethod(lines, fn, this.importManager, this.tupleDefinitions, this.abiTypeConverter)
    )
    lines.push('}')
    return lines.join('\n')
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

  private getViewFunctions(): AbiFunctionItem[] {
    return this.abi.filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability || ''))
  }
}
