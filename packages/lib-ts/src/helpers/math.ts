import { USD } from '../tokens'
import { BigInt } from '../types'

/**
 * Computes the median value from an array of BigInt values.
 * @param values - Array of BigInt values to compute the median from
 * @returns The median BigInt value
 * @throws Error if the array is empty
 */
export function median(values: BigInt[]): BigInt {
  if (values.length === 0) throw new Error('Cannot compute median of empty array')

  const sorted = values.sort((a: BigInt, b: BigInt) => BigInt.compare(a, b))
  const len = sorted.length

  if (len % 2 === 1) return sorted[len / 2]

  const left = sorted[len / 2 - 1]
  const right = sorted[len / 2]
  return left.plus(right).div(BigInt.fromI32(2))
}

/**
 * Computes the median value from an array of USD values.
 * @param values - Array of USD values to compute the median from
 * @returns The median USD value
 * @throws Error if the array is empty
 */
export function medianUSD(values: USD[]): USD {
  return USD.fromBigInt(median(values.map<BigInt>((value: USD) => value.value)))
}
