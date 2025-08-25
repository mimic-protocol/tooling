import { Address, ChainId } from '../types'

import { Token } from './Token'

/**
 * Represents a token on a blockchain network
 */
export abstract class BlockchainToken extends Token {
  private _chainId: ChainId

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
