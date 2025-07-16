import { Token } from '../tokens'
import { ChainId } from '../types'

/* eslint-disable no-secrets/no-secrets */

export namespace Gnosis {
  export const CHAIN_ID = ChainId.GNOSIS
  export const xDAI = Token.native(CHAIN_ID)
  export const USDC = Token.fromString('0x2a22f9c3b484c3629090feed35f17ff8f88f76f0', CHAIN_ID, 6, 'USDC')
  export const USDT = Token.fromString('0x4ecaba5870353805a9f068101a40e0f32ed605c6', CHAIN_ID, 6, 'USDT')
  export const WXDAI = Token.fromString('0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', CHAIN_ID, 18, 'WXDAI')
  export const WBTC = Token.fromString('0x8e5bbbb09ed1ebde8674cda39a0c169401db4252', CHAIN_ID, 8, 'WBTC')
  export const WETH = Token.fromString('0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1', CHAIN_ID, 18, 'WETH')
}
