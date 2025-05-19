import { AbiFunctionItem } from '../../types'

import { ContractClassGenerator } from './ContractClassGenerator'
import { ImportManager } from './ImportManager'

export default {
  generate(abi: AbiFunctionItem[], contractName: string): string {
    const importManager = new ImportManager()
    const contractClassGenerator = new ContractClassGenerator(abi, importManager)

    return contractClassGenerator.generate(contractName)
  },
}
