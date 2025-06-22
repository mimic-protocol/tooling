import { CallBuilder, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const feeToken = Token.fromAddress(inputs.feeToken, inputs.chainId)
  const fee = TokenAmount.fromBigInt(feeToken, inputs.feeAmount)

  CallBuilder.forChainWithFee(inputs.chainId, fee)
    .addCall(inputs.target, inputs.data, inputs.value)
    .addUser(inputs.user)
    .build()
    .send()
}
