import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

export namespace Ethereum {
  export const CHAIN_ID = ChainId.ETHEREUM
  export const ETH = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', CHAIN_ID, 6, 'USDC')
  export const USDT = ERC20Token.fromString('0xdac17f958d2ee523a2206206994597c13d831ec7', CHAIN_ID, 6, 'USDT')
  export const DAI = ERC20Token.fromString('0x6b175474e89094c44da98b954eedeac495271d0f', CHAIN_ID, 18, 'DAI')
  export const WBTC = ERC20Token.fromString('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', CHAIN_ID, 8, 'WBTC')
  export const WETH = ERC20Token.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', CHAIN_ID, 18, 'WETH')
}
