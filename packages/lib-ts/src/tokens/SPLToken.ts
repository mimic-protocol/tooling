import { environment } from '../environment'
import { SVM_NATIVE_ADDRESS } from '../helpers'
import { Address, ChainId, Mint } from '../types'

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
    return SPLToken.fromString(SVM_NATIVE_ADDRESS, ChainId.SOLANA_MAINNET, 9, 'SOL')
  }

  /**
   * Creates a Token instance from an Address object.
   * @param address - The token mint address
   * @param chainId - The blockchain network identifier (optional)
   * @param decimals - Number of decimal places (optional)
   * @param symbol - Token symbol (optional)
   * @returns A new Token instance
   */
  static fromAddress(
    address: Address,
    chainId: ChainId = ChainId.SOLANA_MAINNET,
    decimals: u8 = SPLToken.EMPTY_DECIMALS,
    symbol: string = SPLToken.EMPTY_SYMBOL
  ): SPLToken {
    if (chainId != ChainId.SOLANA_MAINNET) throw new Error(`SPL tokens are only supported for Solana mainnet.`)
    return new SPLToken(address, decimals, symbol)
  }

  /**
   * Creates a Token instance from a string address.
   * @param address - The token mint address as a base58 string
   * @param chainId - The blockchain network identifier (optional)
   * @param decimals - Number of decimal places (optional)
   * @param symbol - Token symbol (optional)
   * @returns A new Token instance
   */
  static fromString(
    address: string,
    chainId: ChainId = ChainId.SOLANA_MAINNET,
    decimals: u8 = SPLToken.EMPTY_DECIMALS,
    symbol: string = SPLToken.EMPTY_SYMBOL
  ): SPLToken {
    return SPLToken.fromAddress(Address.fromString(address), chainId, decimals, symbol)
  }

  /**
   * Creates a new Token instance.
   * @param address - The token mint address
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   */
  constructor(address: Address, decimals: u8 = SPLToken.EMPTY_DECIMALS, symbol: string = SPLToken.EMPTY_SYMBOL) {
    if (!address.isSVM()) throw new Error(`Address ${address} must be an SVM address.`)
    super(address, decimals, symbol, ChainId.SOLANA_MAINNET)
  }

  /**
   * Gets the token’s decimals (number of decimal places used).
   * If decimals were not provided during construction, they will be lazily fetched
   * The fetched value is parsed to `u8` and cached for future accesses.
   * @returns A `u8` representing the number of decimals of the token.
   */
  get decimals(): u8 {
    if (this._decimals == SPLToken.EMPTY_DECIMALS) {
      const result = environment.getAccountsInfo([this.address], null)
      const decimals = Mint.getDecimalsFromHex(result.accountsInfo[0].data)
      this._decimals = decimals
    }
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
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  isNative(): boolean {
    return this.equals(SPLToken.native())
  }
}
