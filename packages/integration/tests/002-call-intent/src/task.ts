import { Address, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const target = Address.fromString(NULL_ADDRESS)
  const feeToken = new Token(inputs.feeToken.toString(), inputs.chainId, 6, 'TEST')
  const feeTokenAmount = TokenAmount.fromStringDecimal(feeToken, inputs.feeAmountStringDecimal)
  CallBuilder.fromTokenAmountAndChain(feeTokenAmount, inputs.chainId)
    .addCall(target, inputs.data, inputs.value)
    .build()
    .send()
}
