import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

import { input } from './types'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.fromI32(0)
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.zero()
  environment.call(settler, input.chainId, target, feeToken, feeAmount, data)
}
