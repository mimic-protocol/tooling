import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Address.fromString(NULL_ADDRESS)
  let feeAmount = BigInt.zero()

  feeAmount = feeAmount.plus(BigInt.fromI32(undeclaredVariable))

  // Replace this with your task code
  environment.createCall(settler, chainId, target, data, feeToken, feeAmount)
}
