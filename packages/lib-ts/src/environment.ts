import { JSON } from 'json-as/assembly'

import { Context, SerializableContext } from './context'
import { ListType } from './helpers'
import { Swap, Transfer, Call } from './intents'
import {
  Call as CallQuery,
  SubgraphQuery,
  GetPrice,
  GetRelevantTokens,
  GetRelevantTokensResponse,
  SubgraphQueryResponse
} from './queries'
import { BlockchainToken, Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, ChainId } from './types'

export namespace environment {
  @external('environment', '_call')
  declare function _call(params: string): void

  @external('environment', '_swap')
  declare function _swap(params: string): void

  @external('environment', '_transfer')
  declare function _transfer(params: string): void

  @external('environment', '_getPrice')
  declare function _getPrice(params: string): string

  @external('environment', '_getRelevantTokens')
  declare function _getRelevantTokens(params: string): string

  @external('environment', '_contractCall')
  declare function _contractCall(params: string): string

  @external('environment', '_subgraphQuery')
  declare function _subgraphQuery(params: string): string

  @external('environment', '_getContext')
  declare function _getContext(): string

  /**
   * Generates a Call intent containing contract calls on the blockchain.
   * @param call - The Call intent to generate
   */
  export function call(call: Call): void {
    _call(JSON.stringify(call))
  }

  /**
   * Generates a Swap intent for token exchange operations.
   * @param swap - The Swap intent to generate
   */
  export function swap(swap: Swap): void {
    _swap(JSON.stringify(swap))
  }

  /**
   * Generates a Transfer intent for sending tokens to recipients.
   * @param transfer - The Transfer intent to generate
   */
  export function transfer(transfer: Transfer): void {
    _transfer(JSON.stringify(transfer))
  }

  /**
   * Tells the prices from different sources for a token in USD at a specific timestamp.
   * @param token - The token to get the price of
   * @param timestamp - The timestamp for price lookup (optional, defaults to current time)
   * @returns The token prices in USD
   */
  export function getRawPrice(token: Token, timestamp: Date | null = null): USD[] {
    if (token.isUSD()) return [USD.fromI32(1)]
    else if (!(token instanceof BlockchainToken)) throw new Error('Price query not supported for token ' + token.toString())
    const prices = _getPrice(JSON.stringify(GetPrice.fromToken(token as BlockchainToken, timestamp)))
    return JSON.parse<string[]>(prices).map<USD>((price) => USD.fromBigInt(BigInt.fromString(price)))
  }

  /**
   * Tells the median price from different sources for a token in USD at a specific timestamp.
   * @param token - The token to get the price of
   * @param timestamp - The timestamp for price lookup (optional, defaults to current time)
   * @returns The token median price in USD
   */
  export function getPrice(token: Token, timestamp: Date | null = null): USD {
    const prices = getRawPrice(token, timestamp)
    if (prices.length === 0) throw new Error('Prices not found for token ' + token.toString())

    const sortedPrices = prices.sort((a: USD, b: USD) => a.compare(b))

    const length = sortedPrices.length
    if (length % 2 === 1) {
      return sortedPrices[length / 2]
    } else {
      const left = sortedPrices[length / 2 - 1]
      const right = sortedPrices[length / 2]
      const sum = left.plus(right)
      return sum.div(BigInt.fromI32(2))
    }
  }

  /**
   * Tells the relevant tokens from different sources for an address at a specific timestamp.
   * @param address - The address to query relevant tokens for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of blockchain tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether to include (AllowList) or exclude (DenyList) the tokens in `tokensList` (optional, defaults to DenyList)
   * @param timestamp - The timestamp for relevant tokens query (optional, defaults to current time)
   * @returns Array of TokenAmount objects representing the relevant tokens
   */
  export function getRawRelevantTokens(address: Address, chainIds: ChainId[], usdMinAmount: USD, tokensList: BlockchainToken[], listType: ListType, timestamp: Date | null): GetRelevantTokensResponse[][] {
    const responseStr = _getRelevantTokens(JSON.stringify(GetRelevantTokens.init(address, chainIds, usdMinAmount, tokensList, listType, timestamp)))
    return JSON.parse<GetRelevantTokensResponse[][]>(responseStr)
  }

  /**
   * Tells the balances of an address for the specified tokens and chains.
   * @param address - The address to query balances for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of blockchain tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether to include (AllowList) or exclude (DenyList) the tokens in `tokensList` (optional, defaults to DenyList)
   * @param timestamp - The timestamp for relevant tokens qery (optional, defaults to current time)
   * @returns Array of TokenAmount objects representing the relevant tokens
   */
  export function getRelevantTokens(
    address: Address,
    chainIds: ChainId[],
    usdMinAmount: USD = USD.zero(),
    tokensList: BlockchainToken[] = [],
    listType: ListType = ListType.DenyList,
    timestamp: Date | null = null
  ): TokenAmount[] {
    const response = getRawRelevantTokens(address, chainIds, usdMinAmount, tokensList, listType, timestamp)
    const resultMap: Map<string, TokenAmount> = new Map()
    for (let i = 0; i < response.length; i++) {
      for (let j = 0; j < response[i].length; j++) {
        const tokenAmount = response[i][j].toTokenAmount()
        const mapKey = tokenAmount.token.address.toString()
        
        if (resultMap.has(mapKey)) continue
        resultMap.set(mapKey, tokenAmount)
      }
    }
    return resultMap.values()
  }

  /**
   * Generates a contract call of a read function on the blockchain and returns the result.
   * @param to - The contract address to call
   * @param chainId - The blockchain network identifier
   * @param timestamp - The timestamp for the call context (optional)
   * @param data - The encoded function call data
   * @returns The raw response from the contract call
   */
  export function contractCall(
    to: Address,
    chainId: ChainId,
    timestamp: Date | null,
    data: string
  ): string {
    return _contractCall(
      JSON.stringify(CallQuery.from(to, chainId, timestamp, data))
    )
  }

  /**
   * Generates a subgraph query and returns the result.
   * @param chainId - The blockchain network identifier
   * @param timestamp - The timestamp for the query context (optional)
   * @param subgraphId - The ID of the subgraph to be called
   * @param query - The string representing the subgraph query to be executed
   * @returns The subgraph query response
   */
  export function subgraphQuery(
    chainId: ChainId,
    timestamp: Date | null,
    subgraphId: string,
    query: string
  ): SubgraphQueryResponse {
    const responseStr = _subgraphQuery(JSON.stringify(new SubgraphQuery(chainId, timestamp, subgraphId, query)))
    return JSON.parse<SubgraphQueryResponse>(responseStr)
  }

  /**
   * Tells the current execution context containing environment information.
   * @returns The Context object containing: user, settler, timestamp, and config ID
   */
  export function getContext(): Context {
    const context = JSON.parse<SerializableContext>(_getContext())
    return Context.fromSerializable(context)
  }
}
