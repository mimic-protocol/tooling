import { Token } from '@mimicprotocol/lib-ts'

export const ETH = Token.native(1)
export const USDC = new Token('USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1, 6)
export const WBTC = new Token('WBTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 1, 8)
export const USDT = new Token('USDT', '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', 137, 6)
export const DAI = new Token('DAI', '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 137, 18)
