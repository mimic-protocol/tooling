import { Address, environment, Ethereum, ListType, Polygon, USD } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const userAddress = Address.zero()
  const expectedChainIds = [Ethereum.CHAIN_ID, Polygon.CHAIN_ID]

  // Case 1: just the expected chains
  environment.getRelevantTokens(userAddress, expectedChainIds)

  // Case 2: with min usd value
  const minUsdValue = USD.fromStringDecimal('1000')
  environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue)

  // Case 3: with allowed/excluded tokens
  const excludedTokens = [Ethereum.ETH]
  const allowedTokens = [Ethereum.USDC, Ethereum.WBTC, Polygon.USDT, Polygon.DAI]
  environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue, excludedTokens)
  environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue, allowedTokens, ListType.AllowList)

  // Case 4: with timestamp
  const timestamp = Date.parse('2025-01-01')
  environment.getRelevantTokens(
    userAddress,
    expectedChainIds,
    minUsdValue,
    allowedTokens,
    ListType.AllowList,
    timestamp
  )
}
