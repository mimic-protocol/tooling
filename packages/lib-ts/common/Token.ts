import { NATIVE_ADDRESS, STANDARD_DECIMALS } from '../constants'
import { convertUsdToTokenAmount, scaleDecimal } from '../helpers'

import { Address } from './Address'
import { BigInt } from './BigInt'
import { TokenAmount } from './TokenAmount'

export class Token {
  private _symbol: string
  private _address: Address
  private _chainId: u64
  private _decimals: u8

  static native(chainId: u64): Token {
    if (chainId === 1) {
      return new Token('ETH', Address.fromString(NATIVE_ADDRESS), chainId, 18)
    }
    throw new Error(`Unsupported chainId: ${chainId}`)
  }

  static equals(token1: Token, token2: Token): boolean {
    const isSameChain = token1.chainId === token2.chainId
    const isSameAddress = token1.address.equals(token2.address)

    return isSameChain && isSameAddress
  }

  constructor(symbol: string, address: Address, chainId: u64, decimals: u8) {
    this._symbol = symbol
    this._address = address.clone()
    this._chainId = chainId
    this._decimals = decimals
  }

  get symbol(): string {
    return this._symbol
  }

  get address(): Address {
    return this._address.clone()
  }

  get chainId(): u64 {
    return this._chainId
  }

  get decimals(): u8 {
    return this._decimals
  }

  equals(other: Token): boolean {
    return Token.equals(this, other)
  }

  fromUsd(decimalUsdAmount: string): TokenAmount {
    const standardUsdAmount = scaleDecimal(decimalUsdAmount, STANDARD_DECIMALS)
    return this.fromStandardUsd(standardUsdAmount)
  }

  fromStandardUsd(usdAmount: BigInt): TokenAmount {
    const tokenAmount = convertUsdToTokenAmount(this, usdAmount)
    return new TokenAmount(this, tokenAmount)
  }

  toString(): string {
    return `Token(${this.symbol}, ${this.address.toHex()}, ${this.chainId}, ${this.decimals})`
  }
}
