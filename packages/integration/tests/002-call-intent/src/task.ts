import { Address, BigInt, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.fromStringDecimal(inputs.feeAmountStringDecimal, 6)
  environment.call(settler, inputs.chainId, target, inputs.feeToken, feeAmount, inputs.data)
}
