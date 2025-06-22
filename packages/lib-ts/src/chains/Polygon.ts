import { Token } from '../tokens'
import { ChainId } from '../types'

export namespace Polygon {
  export const CHAIN_ID = ChainId.POLYGON
  export const POL = Token.native(CHAIN_ID)
  export const USDC = new Token('0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', CHAIN_ID, 6, 'USDC')
  export const USDT = new Token('0xc2132d05d31c914a87c6611c10748aeb04b58e8f', CHAIN_ID, 6, 'USDT')
  export const DAI = new Token('0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', CHAIN_ID, 18, 'DAI')
  export const WBTC = new Token('0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', CHAIN_ID, 8, 'WBTC')
  export const WETH = new Token('0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', CHAIN_ID, 18, 'WETH')
}
