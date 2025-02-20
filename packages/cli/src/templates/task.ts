import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.zero()

  // Replace this with your task code
  environment.call(settler, chainId, target, feeToken, feeAmount, data)
}
