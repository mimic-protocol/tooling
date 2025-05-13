import { STANDARD_DECIMALS } from '../src/helpers'
import { Token } from '../src/tokens'
import { BigInt } from '../src/types'

/* eslint-disable no-secrets/no-secrets */

const CHAIN_IDS: u64[] = [1, 137, 8453, 10, 11155111]

export function zeroPadded(val: BigInt, length: u8): string {
  return val.toString() + '0'.repeat(length)
}

export function randomHex(length: i32): string {
  const hexChars: string = '0123456789abcdef'
  let result: string = '0x'
  for (let i: i32 = 0; i < length; i++) {
    const randomIndex: i32 = <i32>Math.floor(Math.random() * hexChars.length)
    result += hexChars.charAt(randomIndex)
  }
  return result
}

export function randomAddress(): string {
  return randomHex(40)
}

export function randomToken(decimals: u8 = STANDARD_DECIMALS): Token {
  const chainId = CHAIN_IDS[Math.floor(Math.random() * CHAIN_IDS.length) as i32]
  return new Token(randomAddress(), chainId, decimals, 'TEST')
}

export function randomTokenWithPrice(decimals: u8, priceUsd: number): Token {
  const token = randomToken(decimals)
  setTokenPrice(token, priceUsd)
  return token
}

declare function _setTokenPrice(address: string, chainId: u64, price: string): void

export function setTokenPrice(token: Token, priceUsd: number): void {
  const priceStr = (priceUsd * 10 ** STANDARD_DECIMALS).toString()
  _setTokenPrice(token.address.toHexString(), token.chainId, priceStr)
}
