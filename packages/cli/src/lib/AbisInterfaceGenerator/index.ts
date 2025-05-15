import { AbiFunctionItem } from '../../types'

import { ContractClassGenerator } from './ContractClassGenerator'
import { FunctionHandler } from './FunctionHandler'
import { ImportManager } from './ImportManager'

export { FunctionHandler }

export default {
  generate(abi: AbiFunctionItem[], contractName: string): string {
    const viewFunctions = filterViewFunctions(abi)

    const importManager = new ImportManager()
    const contractClassGenerator = new ContractClassGenerator(importManager)

    contractClassGenerator.processAbi(abi)

    const contractClassCode = contractClassGenerator.generateContractClass(viewFunctions, contractName)
    const tupleClassesCode = contractClassGenerator.generateTupleClasses()
    const importsCode = importManager.generateImportsCode() // Note: this should be generated after any other generation

    const separator = '\n\n'
    let result = importsCode + separator + contractClassCode
    if (tupleClassesCode) result += separator + tupleClassesCode

    return result.trim()
  },
}

function filterViewFunctions(abi: AbiFunctionItem[]): AbiFunctionItem[] {
  return abi.filter((item) => item.type === 'function' && ['view', 'pure'].includes(item.stateMutability || ''))
}
