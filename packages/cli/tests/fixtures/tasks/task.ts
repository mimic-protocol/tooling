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

  const feeToken = ERC20Token.fromString(NULL_ADDRESS, chainId, 18, 'TEST')
  const feeAmount = BigInt.fromI32(input.firstStaticNumber).times(BigInt.fromI32(input.secondStaticNumber))
  const fee = TokenAmount.fromBigInt(feeToken, feeAmount)

  CallBuilder.forChain(chainId).addCall(target, data).addSettler(settler).addMaxFee(fee).build().send()
}
