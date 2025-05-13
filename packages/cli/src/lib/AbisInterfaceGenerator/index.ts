import { AbiFunctionItem } from '../../types'

import { ClassGenerator } from './ClassGenerator'
import { ImportManager } from './ImportManager'
import { TupleHandler } from './TupleHandler'

export default {
  generate(abi: AbiFunctionItem[], contractName: string): string {
    const viewFunctions = filterViewFunctions(abi)

    const importManager = new ImportManager()
    const tupleHandler = new TupleHandler()
    const classGenerator = new ClassGenerator(importManager, tupleHandler)

    tupleHandler.extractTupleDefinitions(abi)

    const contractClassCode = classGenerator.generateContractClass(viewFunctions, contractName)
    const tupleClassesCode = classGenerator.generateTupleClassesCode()
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
