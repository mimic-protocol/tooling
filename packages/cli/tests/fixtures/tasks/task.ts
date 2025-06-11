import { Address, BigInt, Bytes, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

/* eslint-disable @typescript-eslint/no-namespace */
declare namespace input {
  const firstStaticNumber: i32
  const secondStaticNumber: i32
}

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const chainId = 1
  const feeAmount = BigInt.zero()

  const feeToken = new Token(NULL_ADDRESS, chainId, 18, 'TEST')

  const fee1 = feeAmount.times(BigInt.fromI32(input.firstStaticNumber))
  const fee2 = feeAmount.times(BigInt.fromI32(input.secondStaticNumber))
  const feeTokenAmount1 = new TokenAmount(feeToken, fee1)
  const feeTokenAmount2 = new TokenAmount(feeToken, fee2)

  // Replace this with your task code
  const builder = CallBuilder.fromTokenAmountAndChain(feeTokenAmount1, chainId)
    .addCall(target, data)
    .addSettler(settler) as CallBuilder
  builder.build().send()
  builder.addFeeTokenAmount(feeTokenAmount2).build().send()
}
