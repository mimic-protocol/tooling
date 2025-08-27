import { SVM_NATIVE_ADDRESS } from '../helpers'
import { Address, ChainId } from '../types'

import { BlockchainToken } from './BlockchainToken'
import { Token } from './Token'

/**
 * Represents a SPL token on the Solana network including data like symbol, decimals, and address.
 */
export class SPLToken extends BlockchainToken {
  /**
   * Creates a Token instance representing the native SOL token.
   * @returns A new Token instance for the native token
   */
  static native(): SPLToken {
    return SPLToken.fromString(SVM_NATIVE_ADDRESS, 9, 'SOL')
  }

  /**
   * Creates a Token instance from an Address object.
   * @param address - The token mint address
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   * @returns A new Token instance
   */
  static fromAddress(address: Address, decimals: u8, symbol: string): SPLToken {
    return new SPLToken(address, decimals, symbol)
  }

  /**
   * Creates a Token instance from a string address.
   * @param address - The token mint address as a base58 string
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   * @returns A new Token instance
   */
  static fromString(address: string, decimals: u8, symbol: string): SPLToken {
    return SPLToken.fromAddress(Address.fromString(address), decimals, symbol)
  }

  /**
   * Creates a new Token instance.
   * @param address - The token mint address
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   */
  constructor(address: Address, decimals: u8, symbol: string) {
    if (!address.isSVM()) throw new Error(`Address ${address} must be an SVM address.`)
    super(address, decimals, symbol, ChainId.SOLANA_MAINNET)
  }

  /**
   * Checks if this token is equal to another token.
   * SPL Tokens are considered equal if they have the same address.
   * @param other - The token to compare with
   * @returns True if both tokens represent the same asset
   */
  equals(other: Token): boolean {
    return other instanceof SPLToken && super.equals(other)
  }

  /**
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  isNative(): boolean {
    return this.equals(SPLToken.native())
  }
}
