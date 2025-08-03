import { Address, BigInt, Bytes, CallBuilder, ChainId, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const chainId = ChainId.ETHEREUM
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const value = BigInt.fromI32(5)
  const fee = TokenAmount.fromI32(Token.fromString(NULL_ADDRESS, chainId), 10)

  CallBuilder.forChain(chainId).addCall(target, data, value).addMaxFee(fee).build().send()
}
