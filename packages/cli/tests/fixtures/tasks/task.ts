import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

/* eslint-disable @typescript-eslint/no-namespace */
declare namespace input {
  const firstStaticNumber: i32
  const secondStaticNumber: i32
}

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
  environment.call(settler, chainId, target, feeToken, fee1, data)
  environment.call(settler, chainId, target, feeToken, fee2, data)
}
