import { environment, Ethereum, TokenAmount, USD } from '@mimicprotocol/lib-ts'

export default function main(): void {
  // Convert USD to WBTC
  const usdAmount = USD.fromStringDecimal('900')
  usdAmount.toTokenAmount(Ethereum.WBTC)

  // Convert X amount of USDC to USD
  const usdcAmount = TokenAmount.fromStringDecimal(Ethereum.USDC, '1000.2')
  usdcAmount.toUsd()

  // Convert USDC to ETH
  usdcAmount.toTokenAmount(Ethereum.ETH)

  // Ask for a price at a certain time
  environment.tokenPriceQuery(Ethereum.USDC, new Date(1744818017000))
}
