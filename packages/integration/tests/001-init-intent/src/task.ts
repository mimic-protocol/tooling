import { Address, BigInt, Bytes, CallBuilder, ChainId, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const value = BigInt.fromString('5')
  const chainId = ChainId.ETHEREUM
  const feeToken = new Token(NULL_ADDRESS, chainId, 18, 'TEST')
  const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

  CallBuilder.fromTokenAmountAndChain(feeTokenAmount, chainId)
    .addCall(target, data, value)
    .addSettler(settler)
    .build()
    .send()
}
