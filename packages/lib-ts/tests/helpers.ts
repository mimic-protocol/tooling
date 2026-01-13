import { JSON } from 'json-as'

import { SerializableSettler } from '../src/context'
import { STANDARD_DECIMALS } from '../src/helpers'
import { TokenBalanceQuery, TokenQuery } from '../src/queries'
import { BlockchainToken, ERC20Token, SPLToken, Token } from '../src/tokens'
import { Address, BigInt, Bytes, ChainId, SvmFindProgramAddressParams, SvmPdaSeed } from '../src/types'

@json
class Log {
  constructor(
    public level: i32,
    public message: string
  ) {}
}

/* eslint-disable no-secrets/no-secrets */

export const CHAIN_IDS: ChainId[] = [
  ChainId.ETHEREUM,
  ChainId.BASE,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.GNOSIS,
  ChainId.SONIC,
]

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

export function randomSvmSettler(): SerializableSettler {
  return new SerializableSettler(randomSvmAddress().toString(), ChainId.SOLANA_MAINNET)
}

export function randomERC20Token(chainId: ChainId = randomChainId(), decimals: u8 = STANDARD_DECIMALS): ERC20Token {
  return ERC20Token.fromAddress(randomEvmAddress(), chainId, decimals, 'TEST')
}

export function randomSPLToken(chainId: ChainId = randomChainId(), decimals: u8 = STANDARD_DECIMALS): SPLToken {
  return SPLToken.fromAddress(randomSvmAddress(), chainId, decimals, 'TEST')
}

export function randomERC20TokenWithPrice(decimals: u8, priceUsd: i32): ERC20Token {
  const chainId = randomChainId()
  const token = randomERC20Token(chainId, decimals)
  setTokenPrice(token, priceUsd)
  return token
}

export function randomSPLTokenWithPrice(decimals: u8, priceUsd: i32): SPLToken {
  const chainId = randomChainId()
  const token = randomSPLToken(chainId, decimals)
  setTokenPrice(token, priceUsd)
  return token
}

declare function _setTokenPrice(address: string, chainId: ChainId, price: string): void

export function setTokenPrice(token: Token, priceUsd: i32): void {
  if (!(token instanceof BlockchainToken)) throw new Error('token must be Blockchaintoken')
  const priceInt = BigInt.fromI32(priceUsd)
  const priceStr = priceInt.upscale(STANDARD_DECIMALS).toString()
  _setTokenPrice(token.address.toHexString(), (token as BlockchainToken).chainId, priceStr)
}

export class TestBalance {
  constructor(
    public token: ERC20Token,
    public balance: TokenBalanceQuery
  ) {}
}

export function createTestBalance(amount: i32, chainId: ChainId = randomChainId()): TestBalance {
  const token = randomERC20Token(chainId, STANDARD_DECIMALS)
  const tokenQuery = TokenQuery.fromToken(token)
  const balance = new TokenBalanceQuery(tokenQuery, zeroPadded(BigInt.fromI32(amount), STANDARD_DECIMALS))
  return new TestBalance(token, balance)
}

export declare function setContractCall(to: string, chainId: ChainId, data: string, result: string): void

export declare function setGetAccountsInfo(publicKeys: string, accountsInfo: string): void

export function setFindProgramAddress(seeds: SvmPdaSeed[], programId: Address, result: string): void {
  const params = new SvmFindProgramAddressParams(seeds, programId.toString())
  _setFindProgramAddress(JSON.stringify(params), result)
}

declare function _setFindProgramAddress(params: string, result: string): void

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
