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

  private compare(other: TokenAmount): i32 {
    if (!Token.equals(this.token, other.token)) {
      this.error('compare')
    }

    return BigInt.compare(this.amount, other.amount)
  }

  private error(action: string): void {
    throw new Error(`Cannot ${action} tokens of different types`)
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
    if (!Token.equals(this.token, other.token)) {
      this.error('sum')
    }

    return new TokenAmount(this.token, this.amount.plus(other.amount))
  }

  minus(other: TokenAmount): TokenAmount {
    if (!Token.equals(this.token, other.token)) {
      this.error('subtract')
    }

    return new TokenAmount(this.token, this.amount.minus(other.amount))
  }

  times(other: TokenAmount): TokenAmount {
    if (!Token.equals(this.token, other.token)) {
      this.error('multiply')
    }

    return new TokenAmount(this.token, this.amount.times(other.amount))
  }

  div(other: TokenAmount): TokenAmount {
    if (!Token.equals(this.token, other.token)) {
      this.error('divide')
    }

    return new TokenAmount(this.token, this.amount.div(other.amount))
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
    return this.amount.isZero()
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
    return `TokenAmount(${this.token.symbol}, ${this.amount.toString()})`
  }
}
