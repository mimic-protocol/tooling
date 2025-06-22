import { Token } from '../tokens'
import { ChainId } from '../types'

export namespace Optimism {
  export const CHAIN_ID = ChainId.OPTIMISM
  export const ETH = Token.native(CHAIN_ID)
  export const USDC = new Token('0x0b2c639c533813f4aa9d7837caf62653d097ff85', CHAIN_ID, 6, 'USDC')
  export const USDT = new Token('0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', CHAIN_ID, 6, 'USDT')
  export const DAI = new Token('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', CHAIN_ID, 18, 'DAI')
  export const WBTC = new Token('0x68f180fcce6836688e9084f035309e29bf0a2095', CHAIN_ID, 8, 'WBTC')
  export const WETH = new Token('0x4200000000000000000000000000000000000006', CHAIN_ID, 18, 'WETH')
}
