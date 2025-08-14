import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace Sonic {
  export const CHAIN_ID = ChainId.SONIC
  export const SONIC = ERC20Token.native(CHAIN_ID)
  export const USDC = ERC20Token.fromString('0x29219dd400f2Bf60E5a23d13Be72B486D4038894', CHAIN_ID, 6, 'USDC')
  export const WETH = ERC20Token.fromString('0x50c42dEAcD8Fc9773493ED674b675bE577f2634b', CHAIN_ID, 18, 'WETH')
  export const WSONIC = ERC20Token.fromString('0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', CHAIN_ID, 18, 'WSONIC')
}
