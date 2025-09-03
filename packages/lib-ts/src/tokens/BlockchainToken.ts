import { Address, ChainId } from '../types'

import { ERC20Token } from './ERC20Token'
import { SPLToken } from './SPLToken'
import { Token } from './Token'

/**
 * Represents a token on a blockchain network
 */
export abstract class BlockchainToken extends Token {
  public static readonly EMPTY_SYMBOL: string = ''
  public static readonly EMPTY_DECIMALS: u8 = u8.MAX_VALUE

  private _chainId: ChainId

  /**
   * Creates a Blockchain Token instance from an Address object.
   * @param address - The contract address of the token
   * @param chainId - The blockchain network identifier
   * @param decimals - Number of decimal places (optional, will be queried if not provided)
   * @param symbol - Token symbol (optional, will be queried if not provided)
   * @returns A new Token instance
   */
  static fromAddress(
    address: Address,
    chainId: ChainId,
    decimals: u8 = BlockchainToken.EMPTY_DECIMALS,
    symbol: string = BlockchainToken.EMPTY_SYMBOL
  ): BlockchainToken {
    if (address.isEVM()) return ERC20Token.fromAddress(address, chainId, decimals, symbol)
    if (chainId != ChainId.SOLANA_MAINNET) throw new Error(`SVM tokens are only supported for Solana mainnet.`)
    return SPLToken.fromAddress(address, ChainId.SOLANA_MAINNET, decimals, symbol)
  }

  /**
   * Creates a Token instance from a string address.
   * @param address - The contract address as a hex string
   * @param chainId - The blockchain network identifier
   * @param symbol - Token symbol (optional, will be queried if not provided)
   * @param decimals - Number of decimal places (optional, will be queried if not provided)
   * @returns A new Blockchain Token instance
   */
  static fromString(
    address: string,
    chainId: ChainId,
    decimals: u8 = BlockchainToken.EMPTY_DECIMALS,
    symbol: string = BlockchainToken.EMPTY_SYMBOL
  ): BlockchainToken {
    return BlockchainToken.fromAddress(Address.fromString(address), chainId, decimals, symbol)
  }

  /**
   * Creates a new BlockchainToken instance
   * @param address The token address in the corresponding blockchain (contract, mint, etc.)
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   * @param chainId - The blockchain network identifier
   */
  constructor(address: Address, decimals: u8, symbol: string, chainId: ChainId) {
    super(address, decimals, symbol)
    this._chainId = chainId
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
   * Checks if this token is the USD denomination.
   * @returns False always
   */
  isUSD(): boolean {
    return false
  }

  /**
   * Checks if this token belongs to the requested chain.
   * @param chain - The chain ID asking for
   * @returns True if chains are equal
   */
  hasChain(chain: ChainId): boolean {
    return this._chainId === chain
  }
}
