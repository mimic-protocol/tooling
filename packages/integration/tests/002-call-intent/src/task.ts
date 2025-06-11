import { Address, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const target = Address.fromString(NULL_ADDRESS)
  const feeToken = new Token(inputs.feeToken.toString(), inputs.chainId, 6, 'TEST')
  const feeTokenAmount = TokenAmount.fromStringDecimal(feeToken, inputs.feeAmountStringDecimal)
  new CallBuilder(feeTokenAmount, inputs.chainId)
    .addCall(target, inputs.data, inputs.value)
    .setSettlerAsString('0x0000000000000000000000000000000000000001')
    .build()
    .send()
}
