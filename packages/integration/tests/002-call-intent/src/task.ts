import { Address, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const feeToken = new Token(inputs.feeToken.toString(), inputs.chainId, 6, 'TEST')
  const feeTokenAmount = TokenAmount.fromStringDecimal(feeToken, inputs.feeAmountStringDecimal)
  environment.call([new CallData(target, inputs.data, inputs.value)], feeTokenAmount, settler)
}
