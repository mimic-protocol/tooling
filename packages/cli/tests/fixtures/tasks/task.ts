import { Address, BigInt, Bytes, CallBuilder, ERC20Token, NULL_ADDRESS, TokenAmount } from '@mimicprotocol/lib-ts'

/* eslint-disable @typescript-eslint/no-namespace */
declare namespace input {
  const firstStaticNumber: i32
  const secondStaticNumber: i32
}

export default function main(): void {
  const chainId = 1
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()

  const maxFeeToken = ERC20Token.fromString(NULL_ADDRESS, chainId, 18, 'TEST')
  const maxFeeAmount = BigInt.fromI32(input.firstStaticNumber).times(BigInt.fromI32(input.secondStaticNumber))
  const maxFee = TokenAmount.fromBigInt(maxFeeToken, maxFeeAmount)

  CallBuilder.forChain(chainId).addCall(target, data).addSettler(settler).addMaxFee(maxFee).build().send()
}
