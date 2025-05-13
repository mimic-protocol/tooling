import { Address, BigInt, Bytes, environment, NULL_ADDRESS, Token } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  // Token definitions
  const USDC = new Token('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1, 6, 'USDC')
  const WBTC = new Token('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 1, 8, 'WBTC')

  // Call without bytes (optional field)
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString('0x0000000000000000000000000000000000000001')
  const chainId = inputs.chainId
  const amount = BigInt.fromI32(inputs.amount)
  environment.call(settler, chainId, target, USDC.address, amount)

  // Call with bytes
  const bytes = Bytes.fromI32(123)
  environment.call(settler, chainId, target, USDC.address, amount, bytes)

  // Cross-chain swap
  const minAmountOut = amount.times(BigInt.fromI32(inputs.slippage)).div(BigInt.fromI32(100))
  const destChain = 10
  environment.swap(settler, chainId, USDC.address, amount, WBTC.address, minAmountOut, destChain)

  // Normal Transfer
  environment.transfer(settler, chainId, USDC.address, amount, target, amount)
}
