/* eslint-disable @typescript-eslint/no-namespace */
declare namespace input {
  const firstStaticNumber: i32
  const secondStaticNumber: i32
}

import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.zero()

  const fee1 = feeAmount.times(BigInt.fromI32(input.firstStaticNumber))
  const fee2 = feeAmount.times(BigInt.fromI32(input.secondStaticNumber))

  // Replace this with your task code
  environment.call(settler, chainId, target, data, feeToken, fee1)
  environment.call(settler, chainId, target, data, feeToken, fee2)
}
