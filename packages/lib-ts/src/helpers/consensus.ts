import { TokenBalanceQuery } from '../queries/RelevantTokensQuery'
import { TokenAmount, USD } from '../tokens'
import { BigInt } from '../types'

import { median } from './math'

/**
 * Computes the median value from an array of USD values.
 * @param values - Array of USD values to compute the median from
 * @returns The median USD value
 * @throws Error if the array is empty
 */
export function medianUSD(values: USD[]): USD {
  return USD.fromBigInt(median(values.map<BigInt>((value: USD) => value.value)))
}

/**
 * Deduplicates token balances by token address.
 * Converts TokenBalanceQuery[][] to TokenAmount[] keeping only the first occurrence of each token address.
 * @param balances - Array of arrays of TokenBalanceQuery to deduplicate
 * @returns Array of unique TokenAmount objects
 */
export function uniqueTokenAmounts(balances: TokenBalanceQuery[][]): TokenAmount[] {
  const resultMap: Map<string, TokenAmount> = new Map()
  for (let i = 0; i < balances.length; i++) {
    for (let j = 0; j < balances[i].length; j++) {
      const tokenAmount = balances[i][j].toTokenAmount()
      const mapKey = tokenAmount.token.address.toString()

      if (resultMap.has(mapKey)) continue
      resultMap.set(mapKey, tokenAmount)
    }
  }
  return resultMap.values()
}
