import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace Polygon {
  export const CHAIN_ID = ChainId.POLYGON
  export const POL = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', CHAIN_ID, 6, 'USDC')
  export const USDT = ERC20Token.fromString('0xc2132D05D31c914a87C6611C10748AEb04B58e8F', CHAIN_ID, 6, 'USDT0')
  export const DAI = ERC20Token.fromString('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', CHAIN_ID, 18, 'DAI')
  export const WBTC = ERC20Token.fromString('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', CHAIN_ID, 8, 'WBTC')
  export const WETH = ERC20Token.fromString('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', CHAIN_ID, 18, 'WETH')
  export const WPOL = ERC20Token.fromString('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', CHAIN_ID, 18, 'WPOL')
}
