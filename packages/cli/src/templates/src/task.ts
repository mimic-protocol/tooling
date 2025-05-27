import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.zero()

  // Replace this with your task code
  environment.call([new CallData(target, data)], feeToken, feeAmount)
}
