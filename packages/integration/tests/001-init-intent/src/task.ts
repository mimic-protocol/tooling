import {
  Address,
  BigInt,
  Bytes,
  CallBuilder,
  ChainId,
  ERC20Token,
  NULL_ADDRESS,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export default function main(): void {
  const chainId = ChainId.ETHEREUM
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const value = BigInt.fromI32(5)
  const fee = TokenAmount.fromI32(ERC20Token.fromString(NULL_ADDRESS, chainId), 10)

  CallBuilder.forEvmChain(chainId).addCall(target, data, value).addMaxFee(fee).build().send()
}
