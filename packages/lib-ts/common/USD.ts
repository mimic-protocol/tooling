import { STANDARD_DECIMALS } from '../constants'
import { scale, unscale } from '../helpers'

import { BigInt } from './BigInt'

export class USD {
  private _amount: BigInt

  static fromDecimal(amount: string): USD {
    return new USD(scale(amount, STANDARD_DECIMALS))
  }

  static zero(): USD {
    return new USD(BigInt.zero())
  }

  constructor(amount: BigInt) {
    this._amount = amount.clone()
  }

  get amount(): BigInt {
    return this._amount.clone()
  }

  isZero(): boolean {
    return this._amount.isZero()
  }

  plus(other: USD): USD {
    return new USD(this._amount.plus(other.amount))
  }

  minus(other: USD): USD {
    return new USD(this._amount.minus(other.amount))
  }

  times(other: USD): USD {
    return new USD(this._amount.times(other.amount))
  }

  div(other: USD): USD {
    return new USD(this._amount.div(other.amount))
  }

  toDecimal(precision: u8 = STANDARD_DECIMALS): string {
    const unscaledAmount = unscale(this._amount, STANDARD_DECIMALS)
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
