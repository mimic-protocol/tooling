import { Address, BigInt, Bytes, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = new Token(NULL_ADDRESS, inputs.chainId, 18, 'TEST')
  const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromI32(2))
  const feeTokenAmount1 = feeTokenAmount.minus(new TokenAmount(feeToken, BigInt.fromI32(1)))
  const feeTokenAmount2 = feeTokenAmount.minus(new TokenAmount(feeToken, BigInt.fromI32(2)))
  const baseCallBuilder = CallBuilder.fromTokenAmountAndChain(feeTokenAmount, inputs.chainId)
    .addCall(target, data)
    .addSettler(settler) as CallBuilder
  baseCallBuilder.build().send()
  baseCallBuilder.addFeeTokenAmount(feeTokenAmount1).build().send()
  baseCallBuilder.addFeeTokenAmount(feeTokenAmount2).build().send()
}
