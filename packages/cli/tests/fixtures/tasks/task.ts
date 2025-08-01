import { Address, BigInt, Bytes, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

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

  const feeToken = Token.fromString(NULL_ADDRESS, chainId, 18, 'TEST')
  const feeAmount = BigInt.fromI32(input.firstStaticNumber).times(BigInt.fromI32(input.secondStaticNumber))
  const fee = TokenAmount.fromBigInt(feeToken, feeAmount)

  CallBuilder.forChainWithFee(chainId, fee).addCall(target, data).addSettler(settler).build().send()
}
