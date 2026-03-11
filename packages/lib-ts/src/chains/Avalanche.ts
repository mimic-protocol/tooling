import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace Avalanche {
  export const CHAIN_ID = ChainId.AVALANCHE
  export const AVAX = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', CHAIN_ID, 6, 'USDC')
  export const USDT = ERC20Token.fromString('0x9702230A8Ea53601f5cd2dc00fDbc13d4dF4A8c7', CHAIN_ID, 6, 'USDt')
  export const DAI = ERC20Token.fromString('0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', CHAIN_ID, 18, 'DAI.e')
  export const WBTC = ERC20Token.fromString('0x50b7545627a5162F82A992c33b87aDc75187B218', CHAIN_ID, 8, 'WBTC.e')
  export const WETH = ERC20Token.fromString('0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', CHAIN_ID, 18, 'WETH.e')
  export const WAVAX = ERC20Token.fromString('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', CHAIN_ID, 18, 'WAVAX')
}
