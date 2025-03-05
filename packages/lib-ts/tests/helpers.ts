import { Address, BigInt, STANDARD_DECIMALS, Token } from '../index'

const CHAIN_IDS: u64[] = [1, 137, 8453, 10, 11155111]

/* eslint-disable no-secrets/no-secrets */
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
  return new Token('TEST', Address.fromString(randomAddress()), chainId, decimals)
}

export function randomTokenWithPrice(decimals: u8, priceUsd: number): Token {
  const token = randomToken(decimals)
  setTokenPrice(token, priceUsd)
  return token
}

declare function _setTokenPrice(address: string, chainId: u64, price: string): void
export function setTokenPrice(token: Token, priceUsd: number): void {
  const priceStr = (priceUsd * 10 ** 18).toString()
  _setTokenPrice(token.address.toHexString(), token.chainId, priceStr)
}

export function scaleAmount(amount: string, decimals: u8): BigInt {
  if (amount === '0') {
    return BigInt.fromI32(0)
  }

  const parts = amount.split('.')
  if (parts.length > 2) throw new Error('Invalid amount. Received: ' + amount)

  let result = BigInt.fromString(parts[0])

  result = result.times(BigInt.fromI32(10).pow(decimals))

  if (parts.length > 1 && parts[1].length > 0) {
    const decimalPart = parts[1].padEnd(decimals, '0').substring(0, decimals)
    result = result.plus(BigInt.fromString(decimalPart))
  }

  return result
}
