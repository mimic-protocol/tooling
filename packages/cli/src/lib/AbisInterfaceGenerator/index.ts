import { AbiFunctionItem } from '../../types'

import { ContractClassGenerator } from './ContractClassGenerator'
import { ImportManager } from './ImportManager'

export default {
  generate(abi: AbiFunctionItem[], contractName: string): string {
    const importManager = new ImportManager()
    const contractClassGenerator = new ContractClassGenerator(importManager)

    return contractClassGenerator.generateInterface(abi, contractName)
  },
}
