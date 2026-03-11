import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace BNB {
  export const CHAIN_ID = ChainId.BNB
  export const BNB = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', CHAIN_ID, 18, 'USDC')
  export const USDT = ERC20Token.fromString('0x55d398326f99059fF775485246999027B3197955', CHAIN_ID, 18, 'USDT')
  export const DAI = ERC20Token.fromString('0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', CHAIN_ID, 18, 'DAI')
  export const WBTC = ERC20Token.fromString('0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3ead9c', CHAIN_ID, 18, 'BTCB')
  export const WETH = ERC20Token.fromString('0x2170Ed0880ac9A755fd29B2688956BD959F933F8', CHAIN_ID, 18, 'ETH')
  export const WBNB = ERC20Token.fromString('0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', CHAIN_ID, 18, 'WBNB')
}
