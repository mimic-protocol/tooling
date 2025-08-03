import { ERC20Token } from '../tokens/ERC20Token'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace Arbitrum {
  export const CHAIN_ID = ChainId.ARBITRUM
  export const ETH = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0xaf88d065e77c8cC2239327C5EDb3A432268e5831', CHAIN_ID, 6, 'USDC')
  export const USDT = ERC20Token.fromString('0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', CHAIN_ID, 6, 'USDT')
  export const DAI = ERC20Token.fromString('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', CHAIN_ID, 18, 'DAI')
  export const WBTC = ERC20Token.fromString('0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', CHAIN_ID, 8, 'WBTC')
  export const WETH = ERC20Token.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1', CHAIN_ID, 18, 'WETH')
}
