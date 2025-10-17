import { ChainId } from '../../types'
import { IntentBuilder } from '../Intent'

import { EvmCallBuilder } from './EvmCall'
import { SvmCallBuilder } from './SvmCall'

/**
 * Builder for creating Call intents with contract call operations.
 * Allows chaining multiple contract calls and configuring fees and settlement parameters.
 */
export abstract class CallBuilder extends IntentBuilder {
  protected chainId: ChainId

  /**
   * Creates an EvmCallBuilder for the specified EVM blockchain network.
   * @param chainId - The EVM blockchain network identifier
   * @returns A new EvmCallBuilder instance
   */
  static forEvmChain(chainId: ChainId): EvmCallBuilder {
    return new EvmCallBuilder(chainId)
  }

  /**
   * Creates a SvmCallBuilder for the Solana blockchain network.
   * @returns A new SvmCallBuilder instance
   */
  static forSvmChain(): SvmCallBuilder {
    return new SvmCallBuilder()
  }

  /**
   * Creates a new CallBuilder instance.
   * @param chainId - The blockchain network identifier
   */
  constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }
}
