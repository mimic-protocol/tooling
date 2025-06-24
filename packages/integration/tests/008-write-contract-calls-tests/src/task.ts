import { Address, environment, ListType, Optimism, Token, TokenAmount, USD } from '@mimicprotocol/lib-ts'

import { AAVE } from './types/AAVE'
import { inputs } from './types'

export default function main(): void {
  const chainId = Optimism.CHAIN_ID

  const USDCe = Token.fromString('0x7f5c764cbc14f9669b88837ca1490cca17c31607', chainId)
  const aUSDC = Token.fromString('0x625e7708f30ca75bfd92586e17077590c60eb4cd', chainId)
  const USDT = Optimism.USDT

  const context = environment.getContext()

  const userTokens = environment.getRelevantTokens(context.user, [chainId], USD.zero(), [aUSDC], ListType.AllowList)

  const feeUsdt = TokenAmount.fromStringDecimal(USDT, inputs.usdFeeAmount)

  const aaveContract = new AAVE(Address.fromString('0x794a61358d6845594f94dc1db02a252b5b4814ad'), chainId)

  aaveContract
    .withdraw(USDCe.address, userTokens[0].amount, context.user)
    .addFee(feeUsdt)
    .addUser(inputs.smartAccount)
    .addSettler(context.settler)
    .build()
    .send()
}
