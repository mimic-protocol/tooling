import { Address, BigInt, environment, ERC20Token, ListType, Optimism, TokenAmount, USD } from '@mimicprotocol/lib-ts'

import { AAVE } from './types/AAVE'
import { WETH } from './types/WETH'
import { inputs } from './types'

export default function main(): void {
  const chainId = Optimism.CHAIN_ID

  const USDCe = ERC20Token.fromString('0x7f5c764cbc14f9669b88837ca1490cca17c31607', chainId)
  const aUSDC = ERC20Token.fromString('0x625e7708f30ca75bfd92586e17077590c60eb4cd', chainId)
  const weth = new WETH(Address.fromString('0x4200000000000000000000000000000000000006'), chainId)
  const USDT = Optimism.USDT

  const context = environment.getContext()

  const userTokens = environment.getRelevantTokens(context.user, [chainId], USD.zero(), [aUSDC], ListType.AllowList)

  const feeUsdt = TokenAmount.fromStringDecimal(USDT, inputs.usdFeeAmount)

  const aaveContract = new AAVE(Address.fromString('0x794a61358d6845594f94dc1db02a252b5b4814ad'), chainId)

  aaveContract
    .withdraw(USDCe.address, userTokens[0].amount, context.user)
    .addMaxFee(feeUsdt)
    .addUser(inputs.smartAccount)
    .build()
    .send()

  weth.deposit(new BigInt(10)).addMaxFee(feeUsdt).addUser(inputs.smartAccount).build().send()
}
