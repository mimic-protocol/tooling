import { WSOL_ADDRESS } from '../helpers'
import { Address, ChainId } from '../types'

import { Token } from './Token'

/**
 * Represents a token on a blockchain network including data like symbol, decimals, and address.
 */
export class SPLToken extends Token {
  private _chainId: ChainId

  /**
   * Creates a Token instance representing the native SOL token.
   * @returns A new Token instance for the native token
   */
  static native(): SPLToken {
    return SPLToken.fromString(WSOL_ADDRESS, 9, 'SOL')
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
    super(address, decimals, symbol)
    this._chainId = ChainId.SOLANA_MAINNET
  }

  /**
   * Gets the blockchain network identifier where this token is deployed.
   * This value is assigned during construction and remains constant throughout the token's lifecycle.
   * @returns The `ChainId` representing the token's network.
   */
  get chainId(): ChainId {
    return this._chainId
  }

  /**
   * Gets the token's symbol (e.g., "SOL", "USDC").
   * @returns A string containing the token symbol.
   */
  get symbol(): string {
    // TODO: Fetch on-chain value
    return this._symbol
  }

  /**
   * Gets the token's decimals (number of decimal places used).
   * @returns A `u8` representing the number of decimals of the token.
   */
  get decimals(): u8 {
    // TODO: Fetch on-chain value
    return this._decimals
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
   * Checks if this token is the USD denomination.
   * @returns False always
   */
  isUSD(): boolean {
    return false
  }

  /**
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  isNative(): boolean {
    return this.equals(SPLToken.native())
  }

  /**
   * Checks if this token belongs to the requested chain.
   * @param chain - The chain ID asking for
   * @returns True if chains are equal
   */
  hasChain(chain: ChainId): boolean {
    return this.chainId === chain
  }
}
