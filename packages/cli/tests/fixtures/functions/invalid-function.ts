import {
  Address,
  BigInt,
  BlockchainToken,
  Bytes,
  EvmCallBuilder,
  NULL_ADDRESS,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const maxFeeToken = BlockchainToken.fromString(NULL_ADDRESS, chainId, 18, 'TEST')
  const maxFeeAmount = BigInt.zero().plus(BigInt.fromI32(undeclaredVariable))
  const maxFee = TokenAmount.fromBigInt(maxFeeToken, maxFeeAmount)

  EvmCallBuilder.forChain(chainId).addCall(target, data).addSettler(settler).addMaxFee(maxFee).build().send()
}
