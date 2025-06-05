import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const value = BigInt.fromString('5')
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.fromString('10')
  const chainId = 1

  // Replace this with your task code
  environment.call([new CallData(target, data, value)], feeToken, feeAmount, chainId, settler)
}
