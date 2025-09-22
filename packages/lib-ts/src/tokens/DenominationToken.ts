import { Address, ChainId } from '../types'

import { Token } from './Token'

/**
 * Represents a denomination token including data like symbol, decimals, and address.
 */
export class DenominationToken extends Token {
  /**
   * Creates a Denomination Token instance representing USD.
   * @returns A new Denomination Token instance for USD
   */
  static USD(): DenominationToken {
    return new DenominationToken(Address.USD(), 18, 'USD')
  }

  /**
   * Creates a new Denomination Token instance.
   * @param address - The contract address of the token
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   */
  constructor(address: Address, decimals: u8, symbol: string) {
    super(address, decimals, symbol)
  }

  /**
   * Checks if this token is equal to another token.
   * Denomination Tokens are considered equal if they have the same address.
   * @param other - The token to compare with
   * @returns True if both tokens represent the denomination token
   */
  equals(other: Token): boolean {
    return other instanceof DenominationToken && super.equals(other)
  }

  /**
   * Checks if this token is the USD denomination.
   * @returns True if the token is the USD denomination
   */
  isUSD(): boolean {
    return this.equals(DenominationToken.USD())
  }

  /**
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  isNative(): boolean {
    return false
  }

  /**
   * Checks if this token belongs to the requested chain.
   * @param chain - The chain ID asking for
   * @returns True always, denomination tokens are chain-agnostic.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasChain(chain: ChainId): boolean {
    return true
  }

  /**
   * Tells the string representation of this token.
   * @returns The token symbol
   */
  toString(): string {
    return this.symbol
  }
}
