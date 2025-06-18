import { Token } from '../tokens/Token'

import { ChainId } from '.'

export namespace Ethereum {
  export const CHAIN_ID = ChainId.ETHEREUM
  export const ETH = Token.native(ChainId.ETHEREUM)
  export const USDC = new Token('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', ChainId.ETHEREUM, 6, 'USDC')
  export const USDT = new Token('0xdac17f958d2ee523a2206206994597c13d831ec7', ChainId.ETHEREUM, 6, 'USDT')
  export const DAI = new Token('0x6b175474e89094c44da98b954eedeac495271d0f', ChainId.ETHEREUM, 18, 'DAI')
  export const WBTC = new Token('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', ChainId.ETHEREUM, 8, 'WBTC')
  export const WETH = new Token('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', ChainId.ETHEREUM, 18, 'WETH')
}
