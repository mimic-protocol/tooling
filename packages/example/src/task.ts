import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'
import { input } from './types'

export default function main(): void {
  // Call withouth bytes (optional field)
  const settler = Address.fromString(NULL_ADDRESS)
  const USDC = Address.fromString("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
  const target = Address.fromString("0x0000000000000000000000000000000000000001")
  const chainId = input.chainId
  const amount = BigInt.fromI32(input.amount)
  environment.call(settler, chainId, target, USDC, amount)

  // Call with bytes
  const bytes = Bytes.fromI32(123)
  environment.call(settler, chainId, target, USDC, amount, bytes)

  // Cross-chain swap
  const WBTC = Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
  const minAmountOut = amount.times(BigInt.fromI32(input.slippage)).div(BigInt.fromI32(100))
  const destChain = 10
  environment.swap(settler, chainId, USDC, amount, WBTC, minAmountOut, destChain)

  // Normal Transfer
  environment.transfer(settler, chainId, USDC, amount, target, amount)
}
