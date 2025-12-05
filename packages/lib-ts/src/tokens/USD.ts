import { environment } from '../environment'
import { STANDARD_DECIMALS } from '../helpers'
import { Token, TokenAmount } from '../tokens'
import { BigInt } from '../types'

/**
 * Represents a USD amount with fixed decimal precision.
 * Supports arithmetic operations, comparisons, and conversions to token amounts.
 */
export class USD {
  private _value: BigInt

  /**
   * Creates a USD instance representing zero dollars.
   * @returns A new USD instance with value 0
   */
  static zero(): USD {
    return new USD(BigInt.zero())
  }

  /**
   * Creates a USD instance from a decimal string representation.
   * @param amount - The amount as a decimal string (e.g., "1.50", "100.00")
   * @returns A new USD instance
   */
  static fromStringDecimal(amount: string): USD {
    return USD.fromBigInt(BigInt.fromStringDecimal(amount, STANDARD_DECIMALS))
  }

  /**
   * Creates a USD instance from a 32-bit integer.
   * @param amount - The amount as a whole number (e.g., 150 for $150.00)
   * @returns A new USD instance
   */
  static fromI32(amount: i32): USD {
    return USD.fromBigInt(BigInt.fromI32(amount).upscale(STANDARD_DECIMALS))
  }

  /**
   * Creates a USD instance from a BigInt amount.
   * @param amount - The amount in 18 decimals precision (must be non-negative)
   * @returns A new USD instance
   */
  static fromBigInt(amount: BigInt): USD {
    return new USD(amount)
  }

  /**
   * Creates a new USD instance.
   * @param amount - The amount in 18 decimals precision (must be non-negative)
   */
  constructor(amount: BigInt) {
    if (amount.isNegative()) throw new Error('USD cannot be negative')
    this._value = amount.clone()
  }

  /**
   * Tells the value of this USD amount in 18 decimals precision.
   * @returns A new BigInt instance representing the value
   */
  get value(): BigInt {
    return this._value.clone()
  }

  /**
   * Checks if this USD amount is zero.
   * @returns True if the amount is zero
   */
  isZero(): boolean {
    return this.value.isZero()
  }

  /**
   * Adds another USD amount to this one.
   * @param other - The USD amount to add
   * @returns A new USD instance representing the sum
   */
  @operator('+')
  plus(other: USD): USD {
    return USD.fromBigInt(this.value.plus(other.value))
  }

  /**
   * Subtracts another USD amount from this one.
   * @param other - The USD amount to subtract
   * @returns A new USD instance representing the difference
   */
  @operator('-')
  minus(other: USD): USD {
    return USD.fromBigInt(this.value.minus(other.value))
  }

  /**
   * Multiplies this USD amount by a BigInt factor.
   * @param other - The BigInt to multiply by
   * @returns A new USD instance representing the product
   */
  @operator('*')
  times(other: BigInt): USD {
    return USD.fromBigInt(this.value.times(other))
  }

  /**
   * Divides this USD amount by a BigInt divisor.
   * @param other - The BigInt to divide by (cannot be zero)
   * @returns A new USD instance representing the quotient
   */
  @operator('/')
  div(other: BigInt): USD {
    return USD.fromBigInt(this.value.div(other))
  }

  /**
   * Checks if this USD amount is equal to another.
   * @param other - The USD amount to compare with
   * @returns True if both amounts are equal
   */
  @operator('==')
  equals(other: USD): boolean {
    return this.compare(other) === 0
  }

  /**
   * Checks if this USD amount is not equal to another.
   * @param other - The USD amount to compare with
   * @returns True if the amounts are different
   */
  @operator('!=')
  notEquals(other: USD): boolean {
    return this.compare(other) !== 0
  }

  /**
   * Checks if this USD amount is less than another.
   * @param other - The USD amount to compare with
   * @returns True if this amount is smaller
   */
  @operator('<')
  lt(other: USD): boolean {
    return this.compare(other) < 0
  }

  /**
   * Checks if this USD amount is greater than another.
   * @param other - The USD amount to compare with
   * @returns True if this amount is larger
   */
  @operator('>')
  gt(other: USD): boolean {
    return this.compare(other) > 0
  }

  /**
   * Checks if this USD amount is less than or equal to another.
   * @param other - The USD amount to compare with
   * @returns True if this amount is smaller or equal
   */
  @operator('<=')
  le(other: USD): boolean {
    return this.compare(other) <= 0
  }

  /**
   * Checks if this USD amount is greater than or equal to another.
   * @param other - The USD amount to compare with
   * @returns True if this amount is larger or equal
   */
  @operator('>=')
  ge(other: USD): boolean {
    return this.compare(other) >= 0
  }

  /**
   * Compares this USD amount with another.
   * @param other - The USD amount to compare with
   * @returns -1 if smaller, 0 if equal, 1 if larger
   */
  compare(other: USD): i32 {
    return BigInt.compare(this._value, other.value)
  }

  /**
   * Tells the string representation of this USD amount.
   * @returns Decimal string representation (e.g., "1.50", "100")
   */
  toString(): string {
    return this._value.toStringDecimal(STANDARD_DECIMALS)
  }

  /**
   * Converts this USD amount to an equivalent token amount.
   * @param token - The target token to convert to
   * @returns A TokenAmount representing the equivalent value in the target token
   */
  toTokenAmount(token: Token): TokenAmount {
    if (this.isZero()) return TokenAmount.fromI32(token, 0)
    const tokenPrice = environment.tokenPriceQuery(token)
    const tokenAmount = this.value.upscale(token.decimals).div(tokenPrice.value)
    return TokenAmount.fromBigInt(token, tokenAmount)
  }
}
