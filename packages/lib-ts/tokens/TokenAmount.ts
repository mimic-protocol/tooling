import { BigInt } from '../common'
import { environment } from '../index'

import { Token } from './Token'
import { USD } from './USD'

export class TokenAmount {
  private _token: Token
  private _amount: BigInt

  static fromStringDecimal(token: Token, amount: string): TokenAmount {
    return this.fromBigInt(token, BigInt.fromStringDecimal(amount, token.decimals))
  }

  static fromI32(token: Token, amount: i32): TokenAmount {
    return this.fromBigInt(token, BigInt.fromI32(amount).upscale(token.decimals))
  }

  static fromBigInt(token: Token, amount: BigInt): TokenAmount {
    return new TokenAmount(token, amount)
  }

  constructor(token: Token, amount: BigInt) {
    if (amount.isNegative()) throw new Error('Amount cannot be negative')
    this._token = token
    this._amount = amount.clone()
  }

  get token(): Token {
    return this._token
  }

  get amount(): BigInt {
    return this._amount.clone()
  }

  get decimals(): u8 {
    return this.token.decimals
  }

  isZero(): boolean {
    return this.amount.isZero()
  }

  @operator('+')
  plus(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'add')
    return TokenAmount.fromBigInt(this.token, this.amount.plus(other.amount))
  }

  @operator('-')
  minus(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'subtract')
    return TokenAmount.fromBigInt(this.token, this.amount.minus(other.amount))
  }

  @operator('*')
  times(other: i32): TokenAmount {
    return TokenAmount.fromBigInt(this.token, this.amount.times(BigInt.fromI32(other)))
  }

  @operator('/')
  div(other: i32): TokenAmount {
    return TokenAmount.fromBigInt(this.token, this.amount.div(BigInt.fromI32(other)))
  }

  @operator('==')
  equals(other: TokenAmount): boolean {
    return this.compare(other) === 0
  }

  @operator('!=')
  notEquals(other: TokenAmount): boolean {
    return this.compare(other) !== 0
  }

  @operator('<')
  lt(other: TokenAmount): boolean {
    return this.compare(other) < 0
  }

  @operator('>')
  gt(other: TokenAmount): boolean {
    return this.compare(other) > 0
  }

  @operator('<=')
  le(other: TokenAmount): boolean {
    return this.compare(other) <= 0
  }

  @operator('>=')
  ge(other: TokenAmount): boolean {
    return this.compare(other) >= 0
  }

  compare(other: TokenAmount): i32 {
    this.checkToken(other.token, 'compare')
    return BigInt.compare(this._amount, other.amount)
  }

  toString(): string {
    return `${this.amount.toStringDecimal(this.decimals)} ${this.token.symbol}`
  }

  toUsd(): USD {
    if (this.isZero()) return USD.zero()
    const tokenPrice = environment.getPrice(this.token)
    const amountUsd = this.amount.times(tokenPrice.value).downscale(this.decimals)
    return USD.fromBigInt(amountUsd)
  }

  toTokenAmount(other: Token): TokenAmount {
    if (this.isZero()) return TokenAmount.fromI32(other, 0)
    return this.toUsd().toTokenAmount(other)
  }

  private checkToken(other: Token, action: string): void {
    if (!this.token.equals(other)) throw new Error(`Cannot ${action} tokens of different types`)
  }
}
