import type { AbiFunctionItem } from '../../types'

import ContractClassGenerator from './ContractClassGenerator'

export default {
  generate(abi: AbiFunctionItem[], contractName: string): string {
    return new ContractClassGenerator(abi).generate(contractName)
  },
}
