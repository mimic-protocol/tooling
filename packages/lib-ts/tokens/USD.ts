import { BigInt } from '../common'
import { STANDARD_DECIMALS } from '../constants'
import { environment } from '../index'
import { Token, TokenAmount } from '../tokens'

export class USD {
  private _value: BigInt

  static fromStringDecimal(amount: string, precision: u8 = STANDARD_DECIMALS): USD {
    return this.fromBigInt(BigInt.fromStringDecimal(amount, precision))
  }

  static fromI32(amount: i32, precision: u8 = STANDARD_DECIMALS): USD {
    return this.fromBigInt(BigInt.fromI32(amount).upscale(precision))
  }

  static fromBigInt(amount: BigInt): USD {
    return new USD(amount)
  }

  static zero(): USD {
    return new USD(BigInt.zero())
  }

  constructor(amount: BigInt) {
    this._value = amount.clone()
  }

  get value(): BigInt {
    return this._value.clone()
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

  isZero(): boolean {
    return this.value.isZero()
  }

  toTokenAmount(token: Token): TokenAmount {
    if (this.isZero()) return TokenAmount.fromI32(token, 0)
    const tokenPrice = environment.getPrice(token)
    const tokenAmount = this.value.upscale(token.decimals).div(tokenPrice.value)
    return TokenAmount.fromBigInt(token, tokenAmount)
  }

  toString(): string {
    return this.toStringDecimal()
  }

  toStringDecimal(precision: u8 = STANDARD_DECIMALS): string {
    return this._value.toStringDecimal(precision)
  }
}
