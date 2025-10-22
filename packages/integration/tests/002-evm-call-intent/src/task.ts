import { ERC20Token, EvmCallBuilder, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const maxFeeToken = ERC20Token.fromAddress(inputs.maxFeeToken, inputs.chainId)
  const maxFee = TokenAmount.fromBigInt(maxFeeToken, inputs.maxFeeAmount)

  EvmCallBuilder.forChain(inputs.chainId)
    .addCall(inputs.target, inputs.data, inputs.value)
    .addUser(inputs.user)
    .addMaxFee(maxFee)
    .build()
    .send()
}
