import { Address, environment, ListType, USD } from '@mimicprotocol/lib-ts'

import { DAI, USDC, USDT, WBTC } from './tokens'

export default function main(): void {
  const userAddress = Address.zero()
  const expectedChainIds: u64[] = [1, 137]

  // Case 1: just the expected chains
  const res1 = environment.getRelevantTokens(userAddress, expectedChainIds)
  console.log(`Case 1: ${res1.map<string>((token) => token.serialize()).join('::')}\n\n`)

  // Case 2: with min usd value
  const minUsdValue = USD.fromStringDecimal('1000')
  const res2 = environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue)
  console.log(`Case 2: ${res2.map<string>((token) => token.serialize()).join('::')}\n\n`)

  // Case 3: with allowed/excluded tokens
  const excludedTokens = [DAI]
  const allowedTokens = [USDC, WBTC, USDT]
  const res3_1 = environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue, excludedTokens)
  const res3_2 = environment.getRelevantTokens(
    userAddress,
    expectedChainIds,
    minUsdValue,
    allowedTokens,
    ListType.AllowList
  )
  console.log(`Case 3 (exclude): ${res3_1.length} tokens`)
  console.log(`Case 3 (allow): ${res3_2.length} tokens`)
}
