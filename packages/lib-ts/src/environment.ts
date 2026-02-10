import { JSON } from 'json-as/assembly'

import { Context, SerializableContext } from './context'
import { evm } from './evm'
import { Consensus, ListType, MIMIC_HELPER_ADDRESS } from './helpers'
import { EvmCall, SvmCall, Swap, Transfer } from './intents'
import {
  EvmCallQuery,
  EvmCallQueryResponse,
  RelevantTokensQuery,
  RelevantTokensQueryResponse,
  SubgraphQuery,
  SubgraphQueryResponse,
  SubgraphQueryResult,
  SvmAccountsInfoQuery,
  SvmAccountsInfoQueryResponse,
  SvmAccountsInfoQueryResult,
  TokenBalanceQuery,
  TokenPriceQuery,
  TokenPriceQueryResponse,
} from './queries'
import { BlockchainToken, Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, Bytes, ChainId, EvmDecodeParam, EvmEncodeParam, Result } from './types'

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
   * Returns an aggregated price (by consensus function) for a token in USD at a specific timestamp.
   * By default, returns the median USD price across multiple sources.
   *
   * @param token - The token to get the USD price for.
   * @param timestamp - Optional. The timestamp for price lookup (defaults to current time if not provided).
   * @param consensusFn - Optional. A function for aggregating the price values (default is median).
   * @returns A `Result` containing either the consensus USD price or an error string.
   */
  export function tokenPriceQuery(
    token: Token,
    timestamp: Date | null = null,
    consensusFn: (values: USD[]) => USD = Consensus.medianUSD
  ): Result<USD, string> {
    if (token.isUSD()) return Result.ok<USD, string>(USD.fromI32(1))
    if (!(token instanceof BlockchainToken)) {
      return Result.err<USD, string>('Price query not supported for token ' + token.toString())
    }

    const responseStr = _tokenPriceQuery(
      JSON.stringify(TokenPriceQuery.fromToken(changetype<BlockchainToken>(token), timestamp))
    )
    const pricesResult = TokenPriceQueryResponse.fromJson<TokenPriceQueryResponse>(responseStr).toResult()

    if (pricesResult.isError) return Result.err<USD, string>(pricesResult.error)

    const prices = pricesResult.unwrap()
    if (prices.length === 0) return Result.err<USD, string>('Prices not found for token ' + token.toString())

    return Result.ok<USD, string>(consensusFn(prices))
  }

  /**
   * Returns the balances of an address for the specified tokens and chains.
   * @param address - The address to query balances for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of blockchain tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether to include (AllowList) or exclude (DenyList) the tokens in `tokensList` (optional, defaults to DenyList)
   * @param consensusFn - Optional. A function for aggregating the token amounts
   * @returns Result containing either an array of TokenAmount objects representing the relevant tokens or an error string
   */
  export function relevantTokensQuery(
    address: Address,
    chainIds: ChainId[],
    usdMinAmount: USD = USD.zero(),
    tokensList: BlockchainToken[] = [],
    listType: ListType = ListType.DenyList,
    consensusFn: (amounts: TokenBalanceQuery[][]) => TokenAmount[] = Consensus.uniqueTokenAmounts
  ): Result<TokenAmount[], string> {
    const responseStr = _relevantTokensQuery(
      JSON.stringify(RelevantTokensQuery.init(address, chainIds, usdMinAmount, tokensList, listType))
    )
    const responseResult = RelevantTokensQueryResponse.fromJson<RelevantTokensQueryResponse>(responseStr).toResult()

    if (responseResult.isError) return Result.err<TokenAmount[], string>(responseResult.error)

    return Result.ok<TokenAmount[], string>(consensusFn(responseResult.unwrap()))
  }

  /**
   * Executes a read-only contract call on the blockchain and returns the result.
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
    timestamp: Date | null = null
  ): Result<string, string> {
    const responseStr = _evmCallQuery(JSON.stringify(EvmCallQuery.from(to, chainId, timestamp, data)))
    return EvmCallQueryResponse.fromJson<EvmCallQueryResponse>(responseStr).toResult()
  }

  /**
   * Executes a subgraph query and returns the result.
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
    timestamp: Date | null = null
  ): Result<SubgraphQueryResult, string> {
    const responseStr = _subgraphQuery(JSON.stringify(SubgraphQuery.from(chainId, subgraphId, query, timestamp)))
    return SubgraphQueryResponse.fromJson<SubgraphQueryResponse>(responseStr).toResult()
  }

  /**
   * Returns on-chain account info for Solana accounts.
   * @param publicKeys - Accounts to read from chain
   * @param timestamp - The timestamp for the call context (optional)
   * @returns Result containing either the account info result or an error string
   */
  export function svmAccountsInfoQuery(
    publicKeys: Address[],
    timestamp: Date | null = null
  ): Result<SvmAccountsInfoQueryResult, string> {
    const responseStr = _svmAccountsInfoQuery(JSON.stringify(SvmAccountsInfoQuery.from(publicKeys, timestamp)))
    return SvmAccountsInfoQueryResponse.fromJson<SvmAccountsInfoQueryResponse>(responseStr).toResult()
  }

  /**
   * Returns the current execution context containing environment information.
   * @returns The Context object containing: user, settler, timestamp, consensusThreshold and triggerPayload
   */
  export function getContext(): Context {
    const context = JSON.parse<SerializableContext>(_getContext())
    return Context.fromSerializable(context)
  }

  /**
   * Returns the native token balance of target account.
   * @param chainId - Chain id to check balance
   * @param target - Address to get balance from
   * @returns The native token balance in wei
   */
  export function getNativeTokenBalance(chainId: ChainId, target: Address): Result<BigInt, string> {
    if (chainId === ChainId.SOLANA_MAINNET) return Result.err<BigInt, string>('Solana not supported')
    const data = '0xeffd663c' + evm.encode([EvmEncodeParam.fromValue('address', target)])
    const response = evmCallQuery(Address.fromHexString(MIMIC_HELPER_ADDRESS), chainId, data)
    if (response.isError) return Result.err<BigInt, string>(response.error)
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response.unwrap()))
    const decoded = BigInt.fromString(decodedResponse)
    return Result.ok<BigInt, string>(decoded)
  }

    /**
   * Returns the code of the target account.
   * @param chainId - Chain id to check code
   * @param target - Address to get code from
   * @returns The code of the target account
   */
  export function getCode(chainId: ChainId, target: Address): Result<Bytes, string> {
    if (chainId === ChainId.SOLANA_MAINNET) return Result.err<Bytes, string>('Solana not supported')
    const data = '0x7e105ce2' + evm.encode([EvmEncodeParam.fromValue('address', target)])
    const response = evmCallQuery(Address.fromHexString(MIMIC_HELPER_ADDRESS), chainId, data)
    if (response.isError) return Result.err<Bytes, string>(response.error)
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes', response.unwrap()))
    const decoded = Bytes.fromHexString(decodedResponse)
    return Result.ok<Bytes, string>(decoded)
  }
}
