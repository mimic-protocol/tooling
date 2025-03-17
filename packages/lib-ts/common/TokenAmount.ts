import { convertTokenAmountToUsd, convertUsdToTokenAmount, scaleDecimal } from '../helpers'

import { BigInt } from './BigInt'
import { Token } from './Token'

export class TokenAmount {
  private _token: Token
  private _amount: BigInt

  static fromDecimal(token: Token, amount: string): TokenAmount {
    const scaledAmount = scaleDecimal(amount, token.decimals)
    return new TokenAmount(token, scaledAmount)
  }

  static product(amounts: TokenAmount[]): TokenAmount {
    if (amounts.length === 0) {
      throw new Error('Cannot multiply an empty array of token amounts')
    }

    return amounts.reduce(
      (product, amount) => product.times(amount),
      new TokenAmount(amounts[0].token, BigInt.fromI32(1))
    )
  }

  static summation(amounts: TokenAmount[]): TokenAmount {
    if (amounts.length === 0) {
      throw new Error('Cannot sum an empty array of token amounts')
    }

    return amounts.reduce((sum, amount) => sum.plus(amount), new TokenAmount(amounts[0].token, BigInt.zero()))
  }

  private checkToken(other: Token, action: string): void {
    if (!this.token.equals(other)) {
      throw new Error(`Cannot ${action} tokens of different types`)
    }
  }

  private compare(other: TokenAmount): i32 {
    this.checkToken(other.token, 'compare')

    return BigInt.compare(this._amount, other.amount)
  }

  constructor(token: Token, amount: BigInt) {
    this._token = token
    this._amount = amount.clone()
  }

  get token(): Token {
    return this._token
  }

  get amount(): BigInt {
    return this._amount.clone()
  }

  plus(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'sum')

    return new TokenAmount(this.token, this._amount.plus(other.amount))
  }

  minus(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'subtract')

    return new TokenAmount(this.token, this._amount.minus(other.amount))
  }

  times(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'multiply')

    return new TokenAmount(this.token, this._amount.times(other.amount))
  }

  div(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'divide')

    return new TokenAmount(this.token, this._amount.div(other.amount))
  }

  equals(other: TokenAmount): boolean {
    return this.compare(other) === 0
  }

  lt(other: TokenAmount): boolean {
    return this.compare(other) < 0
  }

  gt(other: TokenAmount): boolean {
    return this.compare(other) > 0
  }

  le(other: TokenAmount): boolean {
    return this.compare(other) <= 0
  }

  ge(other: TokenAmount): boolean {
    return this.compare(other) >= 0
  }

  isZero(): boolean {
    return this._amount.isZero()
  }

  toStandardUsd(): BigInt {
    return convertTokenAmountToUsd(this.token, this.amount)
  }

  toToken(other: Token): TokenAmount {
    const usdAmount = this.toStandardUsd()
    const otherAmount = convertUsdToTokenAmount(other, usdAmount)
    return new TokenAmount(other, otherAmount)
  }

  toString(): string {
    return `TokenAmount(${this.token.symbol}, ${this._amount.toString()})`
  }
}
