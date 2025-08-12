import { Address, BigInt, Bytes, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Token.fromString(NULL_ADDRESS, chainId, 18, 'TEST')
  const feeAmount = BigInt.zero().plus(BigInt.fromI32(undeclaredVariable))
  const feeTokenAmount = new TokenAmount(feeToken, feeAmount)

  CallBuilder.forChain(chainId).addCall(target, data).addSettler(settler).addMaxFee(feeTokenAmount).build().send()
}
