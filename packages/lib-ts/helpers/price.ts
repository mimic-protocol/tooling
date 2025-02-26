import { BigInt, environment, Token } from '../index'

/**
 * Converts a USD amount into the equivalent amount of tokens
 * @param token - The token to convert USD into
 * @param usdAmount - The amount in USD (expressed in 18 decimal places)
 * @returns The amount of tokens that can be bought (expressed in the token's decimal places)
 *
 * @example
 * // Get how many USDC tokens you can buy with $100
 * // USDC has 6 decimals, price is $1
 * const usdAmount = BigInt.fromString("100000000000000000000") // $100 in 18 decimals
 * const usdcAmount = convertUsdToTokenAmount(usdcToken, usdAmount)
 * // returns 100000000 (100 USDC in 6 decimals)
 */
export function convertUsdToTokenAmount(token: Token, usdAmount: BigInt): BigInt {
  const tokenDecimals = token.getDecimals()

  if (usdAmount.isZero()) return new BigInt(tokenDecimals)

  const tokenPrice = environment.getPrice(token)
  const scaledUsdAmount = usdAmount.times(BigInt.fromI32(10).pow(tokenDecimals))
  const result = scaledUsdAmount.div(tokenPrice)

  if (result.isZero()) return new BigInt(tokenDecimals)

  return result
}

/**
 * Converts a token amount into its USD value
 * @param token - The token to convert to USD
 * @param tokenAmount - The amount of tokens (expressed in token's decimal places)
 * @returns The USD value of the tokens (expressed in 18 decimal places)
 *
 * @example
 * // Get USD value of 100 USDC
 * // USDC has 6 decimals, price is $1
 * const tokenAmount = BigInt.fromString("100000000") // 100 USDC in 6 decimals
 * const usdAmount = convertTokenAmountToUsd(usdcToken, tokenAmount)
 * // returns 100000000000000000000 ($100 in 18 decimals)
 */
export function convertTokenAmountToUsd(token: Token, tokenAmount: BigInt): BigInt {
  if (tokenAmount.isZero()) return new BigInt(18)

  const tokenPrice = environment.getPrice(token)
  const tokenDecimals = token.getDecimals()

  let adjustedAmount = tokenAmount
  const decimalAdjustment: u8 = 18 - tokenDecimals
  if (decimalAdjustment > 0) {
    adjustedAmount = tokenAmount.times(BigInt.fromI32(10).pow(decimalAdjustment))
  }

  return adjustedAmount.times(tokenPrice).div(BigInt.fromI32(10).pow(18))
}

/**
 * Converts an amount from one token to another using their USD prices
 * @param amountFrom - The amount of source tokens (expressed in source token's decimal places)
 * @param tokenFrom - The source token
 * @param tokenTo - The target token
 * @returns The equivalent amount in target tokens (expressed in target token's decimal places)
 *
 * @example
 * // Convert 100 USDC to DAI
 * // USDC has 6 decimals, DAI has 18 decimals, both price $1
 * const usdcAmount = BigInt.fromString("100000000") // 100 USDC in 6 decimals
 * const daiAmount = convertAmountBetweenTokens(usdcAmount, usdcToken, daiToken)
 * // returns 100000000000000000000 (100 DAI in 18 decimals)
 */
export function convertAmountBetweenTokens(amountFrom: BigInt, tokenFrom: Token, tokenTo: Token): BigInt {
  const usdAmount = convertTokenAmountToUsd(tokenFrom, amountFrom)

  return convertUsdToTokenAmount(tokenTo, usdAmount)
}
