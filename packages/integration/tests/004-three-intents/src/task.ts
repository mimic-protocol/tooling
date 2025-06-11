import {
  Address,
  BigInt,
  Bytes,
  CallBuilder,
  NULL_ADDRESS,
  SwapBuilder,
  Token,
  TokenAmount,
  TransferBuilder,
} from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  // Token definitions
  const chainId = inputs.chainId
  const USDC = new Token('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId, 6, 'USDC')
  const WBTC = new Token('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chainId, 8, 'WBTC')
  const feeTokenAmount = TokenAmount.fromStringDecimal(USDC, inputs.amount.toString())

  // Call without bytes (optional field)
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString('0x0000000000000000000000000000000000000001')
  const bytes = Bytes.fromI32(123)

  CallBuilder.fromTokenAmountAndChain(feeTokenAmount, chainId)
    .addCall(target)
    .addCall(target, bytes)
    .addSettler(settler)
    .build()
    .send()

  // Normal swap
  const minAmountOut = BigInt.fromI32(inputs.amount)
    .times(BigInt.fromI32(inputs.slippage))
    .div(BigInt.fromI32(100))
    .toString()
  const tokenIn = TokenAmount.fromStringDecimal(USDC, inputs.amount.toString())
  const tokenOut = TokenAmount.fromStringDecimal(WBTC, minAmountOut)

  SwapBuilder.fromChains(chainId, chainId)
    .addTokenInFromTokenAmount(tokenIn)
    .addTokenOutFromTokenAmount(tokenOut, target)
    .addSettler(settler)
    .build()
    .send()

  // Normal Transfer
  const tokenAmounts = [TokenAmount.fromStringDecimal(USDC, inputs.amount.toString())]
  TransferBuilder.fromTokenAmountAndChain(feeTokenAmount, chainId)
    .addTransfersFromTokenAmounts(tokenAmounts, target)
    .addSettler(settler)
    .build()
    .send()
}
