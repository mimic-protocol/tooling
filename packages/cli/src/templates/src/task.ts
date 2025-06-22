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
  const feeToken = Token.fromString(NULL_ADDRESS, chainId, 18, 'TEST')
  const fee = TokenAmount.fromBigInt(feeToken, BigInt.zero())
  const callBuilder = CallBuilder.forChainWithFee(chainId, fee).addCall(target, data).addSettler(settler)

  // Replace this with your task code
  environment.call(callBuilder.build())
}
