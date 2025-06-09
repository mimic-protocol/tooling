import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

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
  environment.call([new CallData(target)], feeTokenAmount, settler)

  // Call with bytes
  const bytes = Bytes.fromI32(123)
  environment.call([new CallData(target, bytes)], feeTokenAmount, settler)

  // Normal swap
  const minAmountOut = BigInt.fromI32(inputs.amount)
    .times(BigInt.fromI32(inputs.slippage))
    .div(BigInt.fromI32(100))
    .toString()
  const tokenIn = TokenAmount.fromStringDecimal(USDC, inputs.amount.toString())
  const tokenOut = TokenAmount.fromStringDecimal(WBTC, minAmountOut)
  environment.swap([tokenIn], [tokenOut], target, settler)

  // Normal Transfer
  const tokenAmounts = [TokenAmount.fromStringDecimal(USDC, inputs.amount.toString())]
  environment.transfer(tokenAmounts, target, feeTokenAmount, settler)
}
