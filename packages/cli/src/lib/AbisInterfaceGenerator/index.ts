import ContractClassGenerator from './ContractClassGenerator'
import { AbiItem } from './types'

export default {
  generate(abi: AbiItem[], contractName: string): string {
    return new ContractClassGenerator(abi).generate(contractName)
  },
}
