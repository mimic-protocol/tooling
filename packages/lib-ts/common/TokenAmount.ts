import { convertTokenAmountToUsd, convertUsdToTokenAmount, scale } from '../helpers'

import { BigInt } from './BigInt'
import { Token } from './Token'
import { USD } from './USD'

export class TokenAmount {
  private _token: Token
  private _amount: BigInt

  static fromDecimal(token: Token, amount: string): TokenAmount {
    const scaledAmount = scale(amount, token.decimals)
    return new TokenAmount(token, scaledAmount)
  }

  constructor(token: Token, amount: BigInt) {
    if (amount.isNegative()) {
      throw new Error('Amount cannot be negative')
    }
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

  times(decimalValue: string): TokenAmount {
    const scaledAmount = scale(decimalValue, this.token.decimals)
    return new TokenAmount(this.token, this._amount.times(scaledAmount))
  }

  div(decimalValue: string): TokenAmount {
    let result: BigInt

    if (decimalValue.includes('.')) {
      const parts = decimalValue.split('.')
      const decimalPlaces = parts[1].length

      const integerValue = decimalValue.replace('.', '')
      const divisor = BigInt.fromString(integerValue)

      const scaleFactor = BigInt.fromI32(10).pow(decimalPlaces as u8)
      result = this._amount.times(scaleFactor).div(divisor)
    } else {
      result = this._amount.div(BigInt.fromString(decimalValue))
    }

    return new TokenAmount(this.token, scale(result.toString(), this.token.decimals))
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

  toUsd(): USD {
    return convertTokenAmountToUsd(this.token, this.amount)
  }

  toToken(other: Token): TokenAmount {
    const otherAmount = convertUsdToTokenAmount(other, this.toUsd())
    return new TokenAmount(other, otherAmount)
  }

  toString(): string {
    return `${this._amount.toString()} ${this.token.symbol}`
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
}
