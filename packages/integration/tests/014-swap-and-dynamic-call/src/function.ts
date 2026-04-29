import {
  BigInt,
  ERC20Token,
  EvmDynamicArg,
  EvmDynamicCallBuilder,
  EvmEncodeParam,
  IntentBuilder,
  SwapBuilder,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const chainId = inputs.chainId
  const USDC = ERC20Token.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId, 6, 'USDC')
  const maxFee = TokenAmount.fromBigInt(ERC20Token.fromAddress(inputs.maxFeeToken, chainId), inputs.maxFeeAmount)

  const swap = SwapBuilder.forChains(chainId, chainId)
    .addTokenInFromTokenAmount(TokenAmount.fromI32(USDC, 100))
    .addTokenOutFromTokenAmount(TokenAmount.fromI32(USDC, 95), inputs.target)

  const call = EvmDynamicCallBuilder.forChain(chainId).addCall(inputs.target, inputs.selector, [
    EvmDynamicArg.literal([EvmEncodeParam.fromValue('uint256', BigInt.fromI32(123))]),
    EvmDynamicArg.variable(0, 0),
  ])

  new IntentBuilder().addMaxFee(maxFee).addOperationsBuilders([swap, call]).send()
}
