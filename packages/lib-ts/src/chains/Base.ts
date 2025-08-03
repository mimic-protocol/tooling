import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace Base {
  export const CHAIN_ID = ChainId.BASE
  export const ETH = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', CHAIN_ID, 6, 'USDC')
  export const USDT = ERC20Token.fromString('0xfde4c96c8593536e31f229ea8f37b2ada2699bb2', CHAIN_ID, 6, 'USDT')
  export const DAI = ERC20Token.fromString('0x50c5725949a6f0c72e6c4a641f24049a917db0cb', CHAIN_ID, 18, 'DAI')
  export const WBTC = ERC20Token.fromString('0x0555e30da8f98308edb960aa94c0db47230d2b9c', CHAIN_ID, 8, 'WBTC')
  export const WETH = ERC20Token.fromString('0x4200000000000000000000000000000000000006', CHAIN_ID, 18, 'WETH')
}
