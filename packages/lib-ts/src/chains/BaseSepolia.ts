import { ERC20Token } from '../tokens'
import { ChainId } from '../types'

export namespace BaseSepolia {
  export const CHAIN_ID = ChainId.BASE_SEPOLIA
  export const ETH = ERC20Token.native(CHAIN_ID)
}
