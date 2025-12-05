import { Address, Arbitrum, BlockchainToken, environment, Ethereum, ListType, USD } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const userAddress = Address.zero()
  const expectedChainIds = [Ethereum.CHAIN_ID, Arbitrum.CHAIN_ID]

  // Case 1: just the expected chains
  environment.relevantTokensQuery(userAddress, expectedChainIds)

  // Case 2: with min usd value
  const minUsdValue = USD.fromStringDecimal('1000')
  environment.relevantTokensQuery(userAddress, expectedChainIds, minUsdValue)

  // Case 3: with allowed/excluded tokens
  const excludedTokens: BlockchainToken[] = [Ethereum.ETH]
  const allowedTokens: BlockchainToken[] = [Ethereum.USDC, Ethereum.WBTC, Arbitrum.USDT, Arbitrum.DAI]
  environment.relevantTokensQuery(userAddress, expectedChainIds, minUsdValue, excludedTokens)
  environment.relevantTokensQuery(userAddress, expectedChainIds, minUsdValue, allowedTokens, ListType.AllowList)
}
