import {
  Address,
  BigInt,
  Bytes,
  CallBuilder,
  ERC20Token,
  SwapBuilder,
  TokenAmount,
  TransferBuilder,
} from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  // Token definitions
  const chainId = inputs.chainId
  const USDC = ERC20Token.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId, 6, 'USDC')
  const WBTC = ERC20Token.fromString('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chainId, 8, 'WBTC')

  // Call without bytes (optional field)
  const target = Address.fromString('0x0000000000000000000000000000000000000001')
  const bytes = Bytes.fromI32(123)
  const callFee = TokenAmount.fromI32(USDC, 10)

  CallBuilder.forEvmChain(chainId).addCall(target).addCall(target, bytes).addMaxFee(callFee).build().send()

  // Normal swap
  const minAmountOut = BigInt.fromI32(inputs.amount).times(BigInt.fromI32(inputs.slippage)).div(BigInt.fromI32(100))
  const tokenIn = TokenAmount.fromI32(USDC, inputs.amount)
  const tokenOut = TokenAmount.fromStringDecimal(WBTC, minAmountOut.toString())

  SwapBuilder.forChains(chainId, chainId)
    .addTokenInFromTokenAmount(tokenIn)
    .addTokenOutFromTokenAmount(tokenOut, target)
    .build()
    .send()

  // Normal Transfer
  const tokenAmount = TokenAmount.fromI32(USDC, inputs.amount)
  const transferFee = TokenAmount.fromI32(USDC, 10)

  TransferBuilder.forChain(chainId)
    .addTransferFromTokenAmount(tokenAmount, target)
    .addMaxFee(transferFee)
    .build()
    .send()
}
