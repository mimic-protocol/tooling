import { BigInt } from '../common'
import { STANDARD_DECIMALS } from '../constants'
import { environment } from '../index'
import { Token, TokenAmount } from '../tokens'

export class USD {
  private _value: BigInt

  static zero(): USD {
    return new USD(BigInt.zero())
  }

  static fromStringDecimal(amount: string): USD {
    return USD.fromBigInt(BigInt.fromStringDecimal(amount, STANDARD_DECIMALS))
  }

  static fromI32(amount: i32): USD {
    return USD.fromBigInt(BigInt.fromI32(amount).upscale(STANDARD_DECIMALS))
  }

  static fromBigInt(amount: BigInt): USD {
    return new USD(amount)
  }

  constructor(amount: BigInt) {
    this._value = amount.clone()
  }

  get value(): BigInt {
    return this._value.clone()
  }

  isZero(): boolean {
    return this.value.isZero()
  }

  @operator('+')
  plus(other: USD): USD {
    return USD.fromBigInt(this.value.plus(other.value))
  }

  @operator('-')
  minus(other: USD): USD {
    return USD.fromBigInt(this.value.minus(other.value))
  }

  @operator('*')
  times(other: BigInt): USD {
    return USD.fromBigInt(this.value.times(other))
  }

  @operator('/')
  div(other: BigInt): USD {
    return USD.fromBigInt(this.value.div(other))
  }

  @operator('==')
  equals(other: USD): boolean {
    return this.compare(other) === 0
  }

  @operator('!=')
  notEquals(other: USD): boolean {
    return this.compare(other) !== 0
  }

  @operator('<')
  lt(other: USD): boolean {
    return this.compare(other) < 0
  }

  @operator('>')
  gt(other: USD): boolean {
    return this.compare(other) > 0
  }

  @operator('<=')
  le(other: USD): boolean {
    return this.compare(other) <= 0
  }

  @operator('>=')
  ge(other: USD): boolean {
    return this.compare(other) >= 0
  }

  compare(other: USD): i32 {
    return BigInt.compare(this._value, other.value)
  }

  toString(): string {
    return this._value.toStringDecimal(STANDARD_DECIMALS)
  }

  toTokenAmount(token: Token): TokenAmount {
    if (this.isZero()) return TokenAmount.fromI32(token, 0)
    const tokenPrice = environment.getPrice(token)
    const tokenAmount = this.value.upscale(token.decimals).div(tokenPrice.value)
    return TokenAmount.fromBigInt(token, tokenAmount)
  }
}
