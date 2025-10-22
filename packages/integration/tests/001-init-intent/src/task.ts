import {
  Address,
  BigInt,
  Bytes,
  ChainId,
  ERC20Token,
  EvmCallBuilder,
  NULL_ADDRESS,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export default function main(): void {
  const chainId = ChainId.ETHEREUM
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const value = BigInt.fromI32(5)
  const fee = TokenAmount.fromI32(ERC20Token.fromString(NULL_ADDRESS, chainId), 10)

  EvmCallBuilder.forChain(chainId).addCall(target, data, value).addMaxFee(fee).build().send()
}
