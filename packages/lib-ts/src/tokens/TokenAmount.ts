import { environment } from '../environment'
import { BigInt, JSON } from '../types'

import { BlockchainToken } from './BlockchainToken'
import { SerializableToken, Token } from './Token'
import { USD } from './USD'

const BPS_SCALE = BigInt.fromI32(10_000)

/**
 * Represents an amount of a specific token, combining the token metadata with a quantity.
 * Supports arithmetic operations, comparisons, and conversions between tokens and USD.
 */
export class TokenAmount {
  private _token: Token
  private _amount: BigInt

  /**
   * Creates a TokenAmount instance representing zero.
   * @returns A new TokenAmount instance with amount 0
   */
  static zero(token: Token): TokenAmount {
    return this.fromBigInt(token, BigInt.zero())
  }

  /**
   * Creates a TokenAmount from a decimal string representation.
   * @param token - The token to create an amount for
   * @param amount - The amount as a decimal string (e.g., "1.5", "100.0")
   * @returns A new TokenAmount instance
   */
  static fromStringDecimal(token: Token, amount: string): TokenAmount {
    return this.fromBigInt(token, BigInt.fromStringDecimal(amount, token.decimals))
  }

  /**
   * Creates a TokenAmount from a 32-bit integer.
   * @param token - The token to create an amount for
   * @param amount - The amount as a whole number (will be scaled by token decimals)
   * @returns A new TokenAmount instance
   */
  static fromI32(token: Token, amount: i32): TokenAmount {
    return this.fromBigInt(token, BigInt.fromI32(amount).upscale(token.decimals))
  }

  /**
   * Calculates the minimum output amount using basis points (bps).
   * Formula: minAmountOut = amountOut * (10000 - bps) / 10000
   *
   * @param amountOut - The output token amount
   * @param slippage - Slippage in basis points (0-10000). Example: 50 = 0.5%
   * @returns A new TokenAmount representing the minimum output amount
   */
  static fromSlippageBps(amountOut: TokenAmount, slippage: i32): TokenAmount {
    const slippageBpsBI = BigInt.fromI32(slippage)
    if (slippageBpsBI.isNegative() || slippageBpsBI.gt(BPS_SCALE))
      throw new Error(`Slippage bps must be between 0 and ${BPS_SCALE}`)
    return this.fromSlippageWithScale(amountOut, slippageBpsBI)
  }

  /**
   * Calculates the minimum output amount from a percentage string.
   * Formula: minAmountOut = amountOut * (100 - percent) / 100
   *
   * @param amountOut - The output token amount
   * @param slippage - Slippage percentage as a decimal string. Example: '0.5' = 0.5%
   * @returns A new TokenAmount representing the minimum output amount
   */
  static fromSlippagePercentage(amountOut: TokenAmount, slippage: string): TokenAmount {
    const bps = BigInt.fromStringDecimal(slippage, 2)
    if (bps.isNegative() || bps.gt(BPS_SCALE)) throw new Error('Slippage percentage must be between 0 and 100')
    return this.fromSlippageWithScale(amountOut, bps)
  }

  /**
   * Creates a TokenAmount from a BigInt amount.
   * @param token - The token to create an amount for
   * @param amount - The amount in the token's smallest unit (e.g., wei for ETH)
   * @returns A new TokenAmount instance
   */
  static fromBigInt(token: Token, amount: BigInt): TokenAmount {
    return new TokenAmount(token, amount)
  }

  /**
   * Creates a TokenAmount from a serialized string.
   * @param serialized - The serialized string to parse
   * @returns A new TokenAmount instance
   */
  static fromSerializable(serialized: string): TokenAmount {
    const data = JSON.parse<SerializableTokenAmount>(serialized)
    const token = BlockchainToken.fromString(data.token.address, data.token.chainId)
    return TokenAmount.fromStringDecimal(token, data.amount)
  }

  /**
   * Creates a new TokenAmount instance.
   * @param token - The token this amount represents
   * @param amount - The amount in the token's smallest unit (must be non-negative)
   */
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

  /**
   * Checks if this token amount is zero.
   * @returns True if the amount is zero
   */
  isZero(): boolean {
    return this.amount.isZero()
  }

  /**
   * Adds another TokenAmount to this one.
   * @param other - The TokenAmount to add (must be the same token)
   * @returns A new TokenAmount representing the sum
   */
  @operator('+')
  plus(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'add')
    return TokenAmount.fromBigInt(this.token, this.amount.plus(other.amount))
  }

  /**
   * Subtracts another TokenAmount from this one.
   * @param other - The TokenAmount to subtract (must be the same token)
   * @returns A new TokenAmount representing the difference
   */
  @operator('-')
  minus(other: TokenAmount): TokenAmount {
    this.checkToken(other.token, 'subtract')
    return TokenAmount.fromBigInt(this.token, this.amount.minus(other.amount))
  }

  /**
   * Multiplies this TokenAmount by a BigInt factor.
   * @param other - The BigInt to multiply by
   * @returns A new TokenAmount representing the product
   */
  @operator('*')
  times(other: BigInt): TokenAmount {
    return TokenAmount.fromBigInt(this.token, this.amount.times(other))
  }

  /**
   * Divides this TokenAmount by a BigInt divisor.
   * @param other - The BigInt to divide by (cannot be zero)
   * @returns A new TokenAmount representing the quotient
   */
  @operator('/')
  div(other: BigInt): TokenAmount {
    return TokenAmount.fromBigInt(this.token, this.amount.div(other))
  }

  /**
   * Checks if this TokenAmount is less than another.
   * @param other - The TokenAmount to compare with (must be the same token)
   * @returns True if this amount is smaller
   */
  @operator('<')
  lt(other: TokenAmount): boolean {
    this.checkToken(other.token, 'lt')
    return this.amountCompare(other) < 0
  }

  /**
   * Checks if this TokenAmount is greater than another.
   * @param other - The TokenAmount to compare with (must be the same token)
   * @returns True if this amount is larger
   */
  @operator('>')
  gt(other: TokenAmount): boolean {
    this.checkToken(other.token, 'gt')
    return this.amountCompare(other) > 0
  }

  /**
   * Checks if this TokenAmount is less than or equal to another.
   * @param other - The TokenAmount to compare with (must be the same token)
   * @returns True if this amount is smaller or equal
   */
  @operator('<=')
  le(other: TokenAmount): boolean {
    this.checkToken(other.token, 'le')
    return this.amountCompare(other) <= 0
  }

  /**
   * Checks if this TokenAmount is greater than or equal to another.
   * @param other - The TokenAmount to compare with (must be the same token)
   * @returns True if this amount is larger or equal
   */
  @operator('>=')
  ge(other: TokenAmount): boolean {
    this.checkToken(other.token, 'ge')
    return this.amountCompare(other) >= 0
  }

  /**
   * Checks if this TokenAmount is equal to another.
   * @param other - The TokenAmount to compare with
   * @returns True if both represent the same token and amount
   */
  @operator('==')
  equals(other: TokenAmount): boolean {
    return this.token.equals(other.token) && this.amountCompare(other) === 0
  }

  /**
   * Checks if this TokenAmount is not equal to another.
   * @param other - The TokenAmount to compare with
   * @returns True if they represent different tokens or amounts
   */
  @operator('!=')
  notEquals(other: TokenAmount): boolean {
    return !this.token.equals(other.token) || this.amountCompare(other) !== 0
  }

  /**
   * Tells the string representation of this TokenAmount.
   * @returns Formatted string showing the decimal amount and symbol (e.g., "1.5 ETH")
   */
  toString(): string {
    return `${this.amount.toStringDecimal(this.decimals)} ${this.token.symbol}`
  }

  /**
   * Converts this TokenAmount to its USD equivalent.
   * @returns A USD instance representing the current USD value
   */
  toUsd(): USD {
    if (this.isZero()) return USD.zero()
    const tokenPrice = environment.getPrice(this.token)
    const amountUsd = this.amount.times(tokenPrice.value).downscale(this.decimals)
    return USD.fromBigInt(amountUsd)
  }

  /**
   * Converts this TokenAmount to an equivalent amount of another token.
   * @param other - The target token to convert to
   * @returns A TokenAmount of the target token with equivalent USD value
   */
  toTokenAmount(other: Token): TokenAmount {
    if (this.isZero()) return TokenAmount.fromI32(other, 0)
    return this.toUsd().toTokenAmount(other)
  }

  private amountCompare(other: TokenAmount): i32 {
    return BigInt.compare(this._amount, other.amount)
  }

  private checkToken(other: Token, action: string): void {
    if (!this.token.equals(other)) throw new Error(`Cannot ${action} different tokens`)
  }

  private static fromSlippage(amount: TokenAmount, value: BigInt): TokenAmount {
    const factor = BPS_SCALE.minus(value)
    return amountIn.times(factor).div(BPS_SCALE)
  }
}

@json
export class SerializableTokenAmount {
  constructor(
    public token: SerializableToken,
    public amount: string
  ) {}
}
