import { JSON } from 'json-as/assembly'

import { Context, SerializableContext } from './context'
import { ListType } from './helpers'
import { Swap, Transfer, EvmCall, SvmCall } from './intents'
import {
  EvmCallQuery,
  SvmAccountsInfoQuery,
  SvmAccountsInfoQueryResponse,
  TokenPriceQuery,
  RelevantTokensQuery,
  RelevantTokensQueryResult,
  TokenBalanceQuery,
  SubgraphQuery,
  SvmAccountsInfoQueryResult,
  SubgraphQueryResult,
} from './queries'
import { BlockchainToken, Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, ChainId, Result } from './types'
import { EvmCallQueryResponse, PriceQueryResponse, RelevantTokensQueryResponse, SubgraphQueryResponse } from './types/QueryResponse'

export namespace environment {
  @external('environment', '_evmCall')
  declare function _evmCall(params: string): void

  @external('environment', '_svmCall')
  declare function _svmCall(params: string): void

  @external('environment', '_swap')
  declare function _swap(params: string): void

  @external('environment', '_transfer')
  declare function _transfer(params: string): void

  @external('environment', '_tokenPriceQuery')
  declare function _tokenPriceQuery(params: string): string

  @external('environment', '_relevantTokensQuery')
  declare function _relevantTokensQuery(params: string): string

  @external('environment', '_evmCallQuery')
  declare function _evmCallQuery(params: string): string

  @external('environment', '_subgraphQuery')
  declare function _subgraphQuery(params: string): string

  @external('environment', '_svmAccountsInfoQuery')
  declare function _svmAccountsInfoQuery(params: string): string

  @external('environment', '_getContext')
  declare function _getContext(): string

  /**
   * Generates a EVM Call intent containing contract calls on the blockchain.
   * @param call - The EvmCall intent to generate
   */
  export function evmCall(call: EvmCall): void {
    _evmCall(JSON.stringify(call))
  }

  /**
   * Generates a SVM Call intent containing contract calls on the blockchain.
   * @param call - The SvmCall intent to generate
   */
  export function svmCall(call: SvmCall): void {
    _svmCall(JSON.stringify(call))
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
   * @returns Result containing either an array of USD prices or an error string
   */
  export function rawTokenPriceQuery(token: Token, timestamp: Date | null = null): Result<USD[], string> {
    if (token.isUSD()) return Result.ok<USD[], string>([USD.fromI32(1)])
    else if (!(token instanceof BlockchainToken)) return Result.err<USD[], string>('Price query not supported for token ' + token.toString())
    
    const responseStr = _tokenPriceQuery(JSON.stringify(TokenPriceQuery.fromToken(changetype<BlockchainToken>(token), timestamp)))
    const parsed = PriceQueryResponse.fromJson<PriceQueryResponse>(responseStr)
    
    if (parsed.success !== 'true') return Result.err<USD[], string>(parsed.error.length > 0 ? parsed.error : 'Unknown error getting price')
    
    const prices = parsed.data.map<USD>((price) => USD.fromBigInt(BigInt.fromString(price)))
    return Result.ok<USD[], string>(prices)
  }

  /**
   * Tells the median price from different sources for a token in USD at a specific timestamp.
   * @param token - The token to get the price of
   * @param timestamp - The timestamp for price lookup (optional, defaults to current time)
   * @returns Result containing either the median USD price or an error string
   */
  export function tokenPriceQuery(token: Token, timestamp: Date | null = null): Result<USD, string> {
    const pricesResult = rawTokenPriceQuery(token, timestamp)
    
    if (pricesResult.isError) return Result.err<USD, string>(pricesResult.error)
    
    const prices = pricesResult.value
    if (prices.length === 0) return Result.err<USD, string>('Prices not found for token ' + token.toString())

    const sortedPrices = prices.sort((a: USD, b: USD) => a.compare(b))

    const length = sortedPrices.length
    let median: USD
    if (length % 2 === 1) {
      median = sortedPrices[length / 2]
    } else {
      const left = sortedPrices[length / 2 - 1]
      const right = sortedPrices[length / 2]
      const sum = left.plus(right)
      median = sum.div(BigInt.fromI32(2))
    }
    
    return Result.ok<USD, string>(median)
  }

  /**
   * Tells the relevant tokens from different sources for an address at a specific timestamp.
   * @param address - The address to query relevant tokens for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of blockchain tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether to include (AllowList) or exclude (DenyList) the tokens in `tokensList` (optional, defaults to DenyList)
   * @returns Result containing either an array of RelevantTokenBalance arrays or an error string
   */
  export function rawRelevantTokensQuery(address: Address, chainIds: ChainId[], usdMinAmount: USD, tokensList: BlockchainToken[], listType: ListType): Result<TokenBalanceQuery[][], string> {
    const responseStr = _relevantTokensQuery(JSON.stringify(RelevantTokensQuery.init(address, chainIds, usdMinAmount, tokensList, listType)))
    const parsed = RelevantTokensQueryResponse.fromJson<RelevantTokensQueryResponse>(responseStr)
    
    if (parsed.success !== 'true') return Result.err<TokenBalanceQuery[][], string>(parsed.error.length > 0 ? parsed.error : 'Unknown error getting relevant tokens')
    
    const responses = parsed.data
    return Result.ok<TokenBalanceQuery[][], string>(responses.map((response: RelevantTokensQueryResult) => response.balances))
  }

  /**
   * Tells the balances of an address for the specified tokens and chains.
   * @param address - The address to query balances for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of blockchain tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether to include (AllowList) or exclude (DenyList) the tokens in `tokensList` (optional, defaults to DenyList)
   * @returns Array of TokenAmount objects representing the relevant tokens
   */
  export function relevantTokensQuery(
    address: Address,
    chainIds: ChainId[],
    usdMinAmount: USD = USD.zero(),
    tokensList: BlockchainToken[] = [],
    listType: ListType = ListType.DenyList
  ): Result<TokenAmount[], string> {
    const responseResult = rawRelevantTokensQuery(address, chainIds, usdMinAmount, tokensList, listType)
    
    if (responseResult.isError) return Result.err<TokenAmount[], string>(responseResult.error)
    
    const response = responseResult.value
    const resultMap: Map<string, TokenAmount> = new Map()
    for (let i = 0; i < response.length; i++) {
      for (let j = 0; j < response[i].length; j++) {
        const tokenAmount = response[i][j].toTokenAmount()
        const mapKey = tokenAmount.token.address.toString()
        
        if (resultMap.has(mapKey)) continue
        resultMap.set(mapKey, tokenAmount)
      }
    }
    
    return Result.ok<TokenAmount[], string>(resultMap.values())
  }

  /**
   * Generates a contract call of a read function on the blockchain and returns the result.
   * @param to - The contract address to call
   * @param chainId - The blockchain network identifier
   * @param timestamp - The timestamp for the call context (optional)
   * @param data - The encoded function call data
   * @returns The raw response from the contract call
   */
  export function evmCallQuery(
    to: Address,
    chainId: ChainId,
    data: string,
    timestamp: Date | null = null,
  ): Result<string, string> {
    const responseStr = _evmCallQuery(JSON.stringify(EvmCallQuery.from(to, chainId, timestamp, data)))
    const parsed = EvmCallQueryResponse.fromJson<EvmCallQueryResponse>(responseStr)
    if (parsed.success !== 'true') return Result.err<string, string>(parsed.error.length > 0 ? parsed.error : 'Unknown error getting evm call')
    return Result.ok<string, string>(parsed.data)
  }

  /**
   * Generates a subgraph query and returns the result.
   * @param chainId - The blockchain network identifier
   * @param subgraphId - The ID of the subgraph to be called
   * @param query - The string representing the subgraph query to be executed
   * @param timestamp - The timestamp for the query context (optional)
   * @returns The subgraph query response
   */
  export function subgraphQuery(
    chainId: ChainId,
    subgraphId: string,
    query: string,
    timestamp: Date | null = null,
  ): Result<SubgraphQueryResult, string> {
    const responseStr = _subgraphQuery(JSON.stringify(SubgraphQuery.from(chainId, subgraphId, query, timestamp)))
    const parsed = SubgraphQueryResponse.fromJson<SubgraphQueryResponse>(responseStr)
    if (parsed.success !== 'true') return Result.err<SubgraphQueryResult, string>(parsed.error.length > 0 ? parsed.error : 'Unknown error getting subgraph query')
    return Result.ok<SubgraphQueryResult, string>(parsed.data)
  }
   
  /**
   * SVM - Gets on-chain account info
   * @param publicKeys - Accounts to read from chain
   * @param timestamp - The timestamp for the call context (optional)
   * @returns Result containing either the account info result or an error string
   */
  export function svmAccountsInfoQuery(
    publicKeys: Address[],
    timestamp: Date | null = null,
  ): Result<SvmAccountsInfoQueryResult, string> {
    const responseStr = _svmAccountsInfoQuery(JSON.stringify(SvmAccountsInfoQuery.from(publicKeys, timestamp)))
    const parsed = SvmAccountsInfoQueryResponse.fromJson<SvmAccountsInfoQueryResponse>(responseStr)
    
    if (parsed.success !== 'true') return Result.err<SvmAccountsInfoQueryResult, string>(parsed.error.length > 0 ? parsed.error : 'Unknown error getting SVM accounts info')
    
    const result = SvmAccountsInfoQueryResult.fromSerializable(parsed.data)
    return Result.ok<SvmAccountsInfoQueryResult, string>(result)
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
