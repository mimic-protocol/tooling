import { Address, BigInt, Bytes, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'
import { input } from './types'

export default function main(): void {
  // Token definitions
  const USDC = new Token('USDC', Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), 1, 6)
  const ETH = Token.native(1)
  const WBTC = new Token('WBTC', Address.fromString('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'), 1, 8)

  // Call withouth bytes (optional field)
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString("0x0000000000000000000000000000000000000001")
  const chainId = input.chainId
  const amount = BigInt.fromI32(input.amount)
  environment.call(settler, chainId, target, USDC.address, amount)

  // Call with bytes
  const bytes = Bytes.fromI32(123)
  environment.call(settler, chainId, target, USDC.address, amount, bytes)

  // Cross-chain swap
  const minAmountOut = amount.times(BigInt.fromI32(input.slippage)).div(BigInt.fromI32(100))
  const destChain = 10
  environment.swap(settler, chainId, USDC.address, amount, WBTC.address, minAmountOut, destChain)

  // Normal Transfer
  environment.transfer(settler, chainId, USDC.address, amount, target, amount)

  // Convert USD to WBTC
  const decimalUsdAmount = '1200' // $1.200,00
  const wbtcAmount = WBTC.fromUsd(decimalUsdAmount)
  console.log('$1200 of WBTC is ' + wbtcAmount.toString())

  // Convert X amount of USDC to USD
  const decimalUsdcAmount = '100' // 100 USDC
  const usdcAmount = TokenAmount.fromDecimal(USDC, decimalUsdcAmount)
  const usdAmount = usdcAmount.toStandardUsd()
  console.log('100 USDC is ' + usdAmount.toString())

  // Convert USDC to ETH
  const ethAmount = usdcAmount.toToken(ETH)
  console.log('100 USDC is ' + ethAmount.toString())

}
