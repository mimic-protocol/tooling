import { STANDARD_DECIMALS } from '../constants'
import { scale, unscale } from '../helpers'

import { BigInt } from './BigInt'

export class USD {
  private _value: BigInt

  static fromDecimal(amount: string): USD {
    return new USD(scale(amount, STANDARD_DECIMALS))
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

  isZero(): boolean {
    return this._value.isZero()
  }

  plus(other: USD): USD {
    return new USD(this._value.plus(other.value))
  }

  minus(other: USD): USD {
    return new USD(this._value.minus(other.value))
  }

  times(other: USD): USD {
    return new USD(this._value.times(other.value))
  }

  div(other: USD): USD {
    return new USD(this._value.div(other.value))
  }

  toDecimal(precision: u8 = STANDARD_DECIMALS): string {
    const unscaledAmount = unscale(this._value, STANDARD_DECIMALS)
    if (precision === STANDARD_DECIMALS) return unscaledAmount

    const parts = unscaledAmount.split('.')
    if (parts.length === 1) return unscaledAmount

    const whole = parts[0]
    const decimal = parts[1]
    const roundedDecimal = decimal.slice(0, precision)
    return `${whole}.${roundedDecimal}`
  }

  toString(): string {
    return this.toDecimal()
  }
}
