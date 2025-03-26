import { environment } from '../environment'
import { join, SEPARATOR, Serializable, serialize } from '../helpers/serialize'
import { BigInt } from '../types'

import { Token } from './Token'
import { USD } from './USD'

export class TokenAmount implements Serializable {
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

  static deserialize(serialized: string): TokenAmount {
    if (serialized.length === 0) throw new Error('Invalid serialized token amount')

    const elements = serialized.split(SEPARATOR)
    const amount = BigInt.deserialize(elements[0])
    const token = Token.deserialize(elements.slice(1).join(SEPARATOR))

    return new TokenAmount(token, amount)
  }

  constructor(token: Token, amount: BigInt) {
    if (amount.isNegative()) throw new Error('Token amount cannot be negative')
    this._token = token
    this._amount = amount.clone()
  }

  get token(): Token {
    return this._token
  }

  get amount(): BigInt {
    return this._amount.clone()
  }

  get symbol(): string {
    return this.token.symbol
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
  times(other: BigInt): TokenAmount {
    return TokenAmount.fromBigInt(this.token, this.amount.times(other))
  }

  @operator('/')
  div(other: BigInt): TokenAmount {
    return TokenAmount.fromBigInt(this.token, this.amount.div(other))
  }

  @operator('<')
  lt(other: TokenAmount): boolean {
    this.checkToken(other.token, 'lt')
    return this.amountCompare(other) < 0
  }

  @operator('>')
  gt(other: TokenAmount): boolean {
    this.checkToken(other.token, 'gt')
    return this.amountCompare(other) > 0
  }

  @operator('<=')
  le(other: TokenAmount): boolean {
    this.checkToken(other.token, 'le')
    return this.amountCompare(other) <= 0
  }

  @operator('>=')
  ge(other: TokenAmount): boolean {
    this.checkToken(other.token, 'ge')
    return this.amountCompare(other) >= 0
  }

  @operator('==')
  equals(other: TokenAmount): boolean {
    return this.token.equals(other.token) && this.amountCompare(other) === 0
  }

  @operator('!=')
  notEquals(other: TokenAmount): boolean {
    return !this.token.equals(other.token) || this.amountCompare(other) !== 0
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

  serialize(): string {
    return join([serialize(this.amount), this.token.serialize()])
  }

  private amountCompare(other: TokenAmount): i32 {
    return BigInt.compare(this._amount, other.amount)
  }

  private checkToken(other: Token, action: string): void {
    if (!this.token.equals(other)) throw new Error(`Cannot ${action} different tokens`)
  }
}
