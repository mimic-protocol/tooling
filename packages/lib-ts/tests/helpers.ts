import { JSON } from 'json-as'

import { SerializableSettler } from '../src/context'
import { STANDARD_DECIMALS } from '../src/helpers'
import { ERC20Token } from '../src/tokens'
import { Address, BigInt, Bytes, ChainId } from '../src/types'

@json
class Log {
  constructor(
    public level: i32,
    public message: string
  ) {}
}

/* eslint-disable no-secrets/no-secrets */

export const CHAIN_IDS: ChainId[] = [ChainId.ETHEREUM, ChainId.BASE, ChainId.ARBITRUM, ChainId.OPTIMISM, ChainId.GNOSIS]

export function randomChainId(): ChainId {
  return CHAIN_IDS[Math.floor(Math.random() * CHAIN_IDS.length) as i32]
}

export function zeroPadded(val: BigInt, length: u8): string {
  return val.toString() + '0'.repeat(length)
}

export function randomEvmAddress(): Address {
  return Address.fromString(randomHex(40))
}

export function randomSvmAddress(): Address {
  return Address.fromBytes(randomBytes(64))
}

export function randomBytes(nibbles: i32): Bytes {
  return Bytes.fromHexString(randomHex(nibbles))
}

export function randomHex(length: i32): string {
  return '0x' + randomString('0123456789abcdef', length)
}

export function randomBase58(length: i32): string {
  return randomString('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', length)
}

export function randomString(alphabet: string, length: number): string {
  let result: string = ''
  for (let i: i32 = 0; i < length; i++) {
    const randomIndex: i32 = <i32>Math.floor(Math.random() * alphabet.length)
    result += alphabet.charAt(randomIndex)
  }
  return result
}

export function randomSettler(chainId: ChainId = randomChainId()): SerializableSettler {
  return new SerializableSettler(randomEvmAddress().toString(), chainId)
}

export function randomToken(chainId: ChainId = randomChainId(), decimals: u8 = STANDARD_DECIMALS): ERC20Token {
  return ERC20Token.fromAddress(randomEvmAddress(), chainId, decimals, 'TEST')
}

export function randomTokenWithPrice(decimals: u8, priceUsd: number): ERC20Token {
  const chainId = randomChainId()
  const token = randomToken(chainId, decimals)
  setTokenPrice(token, priceUsd)
  return token
}

declare function _setTokenPrice(address: string, chainId: ChainId, price: string): void

export function setTokenPrice(token: ERC20Token, priceUsd: number): void {
  const priceStr = (priceUsd * 10 ** STANDARD_DECIMALS).toString()
  _setTokenPrice(token.address.toHexString(), token.chainId, priceStr)
}

export declare function setContractCall(to: string, chainId: ChainId, data: string, result: string): void

export declare function setEvmDecode(abiType: string, hex: string, decoded: string): void

export declare function _setContext(
  timestamp: u64,
  consensusThreshold: u8,
  user: string,
  settlers: string,
  configSig: string
): void

export function setContext(
  timestamp: u64,
  consensusThreshold: u8,
  user: string,
  settlers: SerializableSettler[],
  configSig: string
): void {
  _setContext(timestamp, consensusThreshold, user, JSON.stringify(settlers), configSig)
}

export declare function clearLogs(): void

declare function _getLogs(): string

export function getLogs(): Log[] {
  return JSON.parse<Log[]>(_getLogs())
}

declare function _getLogsByLevel(level: i32): string

export function getLogsByLevel(level: i32): Log[] {
  return JSON.parse<Log[]>(_getLogsByLevel(level))
}
