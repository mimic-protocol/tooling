import { environment, Token, TokenAmount, USD } from '@mimicprotocol/lib-ts'

export default function main(): void {
  // Token definitions
  const USDC = new Token('USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1, 6)
  const WBTC = new Token('WBTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 1, 8)
  const ETH = Token.native(1)

  // Convert USD to WBTC
  const usdAmount = USD.fromStringDecimal('900')
  usdAmount.toTokenAmount(WBTC)

  // Convert X amount of USDC to USD
  const usdcAmount = TokenAmount.fromStringDecimal(USDC, '1000.2')
  usdcAmount.toUsd().toString()

  // Convert USDC to ETH
  usdcAmount.toTokenAmount(ETH)

  // Ask for a price at a certain time
  environment.getPrice(USDC, new Date(1744818017000))
}
