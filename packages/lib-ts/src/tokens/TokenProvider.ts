import { ChainId } from '../types'

import { BlockchainToken } from './BlockchainToken'

/**
 * Represents a token provider that can resolve to a specific BlockchainToken instance
 * based on the provided chain ID.
 * This allows for convenient access to common tokens across different chains.
 * Supports both ERC20Token (EVM chains) and SPLToken (Solana).
 */
export class TokenProvider {
  private _symbol: string
  private _registry: Map<ChainId, BlockchainToken>

  /**
   * Creates a new TokenProvider instance.
   * @param symbol - The token symbol (e.g., "USDC", "USDT")
   */
  constructor(symbol: string) {
    this._symbol = symbol
    this._registry = new Map<ChainId, BlockchainToken>()
  }

  /**
   * Registers a token for a specific chain.
   * @param chainId - The chain ID to register the token for
   * @param token - The BlockchainToken instance for this chain (ERC20Token or SPLToken)
   * @returns The TokenProvider instance for method chaining
   */
  register(chainId: ChainId, token: BlockchainToken): TokenProvider {
    this._registry.set(chainId, token)
    return this
  }

  /**
   * Resolves the token provider to a specific BlockchainToken instance for the given chain.
   * @param chainId - The chain ID to resolve the token for
   * @returns The BlockchainToken instance for the specified chain
   * @throws Error if the token is not supported on the requested chain
   */
  on(chainId: i32): BlockchainToken {
    if (!this.isSupported(chainId)) throw new Error(`Token ${this._symbol} is not registered on chain ${chainId}`)
    return this._registry.get(chainId)
  }

  /**
   * Checks if the token is supported on the given chain.
   * @param chainId - The chain ID to check
   * @returns True if the token is supported on the chain, false otherwise
   */
  isSupported(chainId: i32): bool {
    return this._registry.has(chainId)
  }
}
