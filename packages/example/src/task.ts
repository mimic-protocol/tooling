import { Address, BigInt, Bytes, environment, NULL_ADDRESS, Token, TokenAmount, USD } from '@mimicprotocol/lib-ts'
import { input } from './types'
import { ERC20 } from './types/ERC20'

export default function main(): void {
  // Token definitions
  const ETH = Token.native(1)
  const USDC = new Token('USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1, 6)
  const WBTC = new Token('WBTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 1, 8)

  // Call without bytes (optional field)
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

  // Contract Call
  const usdcContract = new ERC20(USDC.address, USDC.chainId)
  const usdcDecimals = usdcContract.decimals()
  const usdcTotalSupply = usdcContract.totalSupply()
  const usdcTargetBalance = usdcContract.balanceOf(target)

  console.log(`Decimals: ${usdcDecimals} - Total Supply: ${usdcTotalSupply.toString()} - Target Balance: ${usdcTargetBalance.toString()}`)

  // Convert USD to WBTC
  const usdAmount = USD.fromStringDecimal('1200.5') // $1.200,50
  const wbtcAmount = usdAmount.toTokenAmount(WBTC)
  console.log('$1200.50 worth of WBTC is ' + wbtcAmount.toString())

  // Convert X amount of USDC to USD
  const decimalUsdcAmount = '100' // 100 USDC
  const usdcAmount = TokenAmount.fromStringDecimal(USDC, decimalUsdcAmount)
  console.log('100 USDC is worth $' + usdcAmount.toUsd().toString())

  // Convert USDC to ETH
  const ethAmount = usdcAmount.toTokenAmount(ETH)
  console.log('100 USDC is ' + ethAmount.toString())

}
