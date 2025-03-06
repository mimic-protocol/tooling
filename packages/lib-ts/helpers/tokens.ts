import { BigInt, environment, STANDARD_DECIMALS, Token } from '../index'

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
  const zeroAmount = new BigInt(token.decimals)
  if (usdAmount.isZero()) return zeroAmount

  const tokenPrice = environment.getPrice(token)
  const scaledUsdAmount = usdAmount.times(BigInt.fromI32(10).pow(token.decimals))
  const result = scaledUsdAmount.div(tokenPrice)

  if (result.isZero()) return zeroAmount

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
  if (tokenAmount.isZero()) return BigInt.zero()

  const tokenPrice = environment.getPrice(token)

  const isStandardToken = token.decimals <= STANDARD_DECIMALS
  const decimalAdjustment: u8 = isStandardToken
    ? STANDARD_DECIMALS - token.decimals
    : token.decimals - STANDARD_DECIMALS
  const adjustmentFactor = BigInt.fromI32(10).pow(decimalAdjustment)
  const adjustedAmount = isStandardToken ? tokenAmount.times(adjustmentFactor) : tokenAmount.div(adjustmentFactor)

  return adjustedAmount.times(tokenPrice).div(BigInt.fromI32(10).pow(STANDARD_DECIMALS))
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

/**
 * Converts a decimal string to a BigInt with the specified number of decimal places
 * @param amount - The amount as a decimal string (e.g., "123.45")
 * @param decimals - The number of decimal places to scale to
 * @returns The amount as a BigInt with the appropriate decimal scaling
 *
 * @example
 * // Convert "123.45" to a BigInt with 6 decimal places
 * const scaledAmount = scaleDecimal("123.45", 6)
 * // returns 123450000 (123.45 × 10^6)
 */
export function scaleDecimal(amount: string, decimals: u8): BigInt {
  if (amount === '0') {
    return BigInt.fromI32(0)
  }

  const parts = amount.split('.')
  if (parts.length > 2) throw new Error('Invalid amount. Received: ' + amount)

  let result = BigInt.fromString(parts[0])

  result = result.times(BigInt.fromI32(10).pow(decimals))

  if (parts.length > 1 && parts[1].length > 0) {
    const decimalPart = parts[1].padEnd(decimals, '0').substring(0, decimals)
    result = result.plus(BigInt.fromString(decimalPart))
  }

  return result
}
