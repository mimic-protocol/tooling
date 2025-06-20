import {
  Address,
  BigInt,
  Bytes,
  CallBuilder,
  environment,
  NULL_ADDRESS,
  Token,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export default function main(): void {
  const chainId = 1
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = new Token(NULL_ADDRESS, chainId, 18, 'TEST')
  const feeTokenAmount = new TokenAmount(feeToken, BigInt.zero())
  const callBuilder = new CallBuilder(feeTokenAmount, chainId).addCall(target, data).addSettler(settler)

  // Replace this with your task code
  environment.call(callBuilder.build())
}
