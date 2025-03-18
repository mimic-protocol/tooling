/* eslint-disable no-secrets/no-secrets */
import { USD } from '../common/USD'
import { BigInt, environment, STANDARD_DECIMALS, Token } from '../index'

/**
 * Converts a USD amount into the equivalent amount of tokens
 * @param token - The token to convert USD into
 * @param usdAmount - The amount in USD
 * @returns The amount of tokens that can be bought (expressed in the token's decimal places)
 *
 * @example
 * // Get how many USDC tokens you can buy with $100
 * // USDC has 6 decimals, price is $1
 * const usdAmount = USD.fromDecimal("100") // $100
 * const usdcAmount = convertUsdToTokenAmount(usdcToken, usdAmount)
 * // returns 100000000 (100 USDC in 6 decimals)
 */
export function convertUsdToTokenAmount(token: Token, usdAmount: USD): BigInt {
  const zeroAmount = new BigInt(token.decimals)
  if (usdAmount.isZero()) return zeroAmount

  const tokenPrice = environment.getPrice(token)
  const scaledUsdAmount = scale(usdAmount.value.toString(), token.decimals)
  const result = scaledUsdAmount.div(tokenPrice.value)

  if (result.isZero()) return zeroAmount

  return result
}

/**
 * Converts a token amount into its USD value
 * @param token - The token to convert to USD
 * @param tokenAmount - The amount of tokens (expressed in token's decimal places)
 * @returns The USD value of the tokens
 *
 * @example
 * // Get USD value of 100 USDC
 * // USDC has 6 decimals, price is $1
 * const tokenAmount = BigInt.fromString("100000000") // 100 USDC in 6 decimals
 * const usdAmount = convertTokenAmountToUsd(usdcToken, tokenAmount)
 * // returns USD("100")
 */
export function convertTokenAmountToUsd(token: Token, tokenAmount: BigInt): USD {
  if (tokenAmount.isZero()) return new USD(BigInt.zero())

  const tokenPrice = environment.getPrice(token)
  const unscaledAmount = unscale(tokenAmount, token.decimals)
  const scaledAmount = scale(unscaledAmount, STANDARD_DECIMALS)

  return new USD(scaledAmount.times(tokenPrice.value).div(BigInt.fromI32(10).pow(STANDARD_DECIMALS)))
}

/**
 * Converts a decimal string to a BigInt with the specified number of decimal places
 * @param amount - The amount as a decimal string (e.g., "123.45")
 * @param decimals - The number of decimal places to scale to
 * @returns The amount as a BigInt with the appropriate decimal scaling
 *
 * @example
 * // Convert "123.45" to a BigInt with 6 decimal places
 * const scaledAmount = scale("123.45", 6)
 * // returns 123450000 (123.45 × 10^6)
 */
export function scale(amount: string, decimals: u8): BigInt {
  if (amount === '0') {
    return BigInt.fromI32(0)
  }

  const parts = amount.split('.')
  if (parts.length > 2) throw new Error('Invalid amount. Received: ' + amount)

  const isNegative = parts[0].startsWith('-')
  const wholePart = isNegative ? parts[0].substring(1) : parts[0]

  let result = BigInt.fromString(wholePart)
  result = result.times(BigInt.fromI32(10).pow(decimals))

  if (parts.length > 1 && parts[1].length > 0) {
    const decimalPart = parts[1].padEnd(decimals, '0').substring(0, decimals)
    result = result.plus(BigInt.fromString(decimalPart))
  }

  return isNegative ? result.neg() : result
}

/**
 * Converts a BigInt amount back to a decimal string
 * @param amount - The amount as a BigInt
 * @param decimals - The number of decimal places to consider
 * @returns The amount as a decimal string (e.g., "123.45")
 *
 * @example
 * // Convert a BigInt with 18 decimals to a decimal string
 * const amount = BigInt.fromString("123456789012345678")
 * const decimalStr = unscale(amount, 18)
 * // returns "1.23456789012345678"
 */
export function unscale(amount: BigInt, decimals: u8): string {
  if (amount.isZero()) return '0'

  const isNegative = amount.isNegative()
  const absAmount = isNegative ? amount.neg() : amount

  const str = absAmount.toString()
  if (str.length <= (decimals as i32)) {
    return (isNegative ? '-' : '') + '0.' + str.padStart(decimals, '0')
  }
  const wholePart = str.slice(0, str.length - decimals)
  const decimalPart = str.slice(str.length - decimals)

  return (isNegative ? '-' : '') + wholePart + '.' + decimalPart
}
