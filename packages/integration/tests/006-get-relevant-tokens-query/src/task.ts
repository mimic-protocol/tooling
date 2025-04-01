import { Address, environment, ListType, Token, USD } from '@mimicprotocol/lib-ts'

export default function main(): void {
  // Token definitions
  const ETH = Token.native(1)
  const USDC = new Token('USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1, 6)
  const WBTC = new Token('WBTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 1, 8)
  const USDT = new Token('USDT', '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', 137, 6)
  const DAI = new Token('DAI', '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 137, 18)

  const userAddress = Address.zero()
  const expectedChainIds: u64[] = [1, 137]

  // Case 1: just the expected chains
  environment.getRelevantTokens(userAddress, expectedChainIds)

  // Case 2: with min usd value
  const minUsdValue = USD.fromStringDecimal('1000')
  environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue)

  // Case 3: with allowed/excluded tokens
  const excludedTokens = [ETH]
  const allowedTokens = [USDC, WBTC, USDT, DAI]
  environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue, excludedTokens)
  environment.getRelevantTokens(userAddress, expectedChainIds, minUsdValue, allowedTokens, ListType.AllowList)
}
