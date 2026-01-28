import { Optimism, TokenAmount, TransferBuilder } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  // Get the inputs
  const amount = inputs.amount
  const recipient = inputs.recipient

  TransferBuilder.forChain(Optimism.CHAIN_ID)
    .addTransferFromTokenAmount(amount, recipient)
    .addMaxFee(TokenAmount.fromStringDecimal(Optimism.USDC, '1'))
    .build()
    .send()
}
