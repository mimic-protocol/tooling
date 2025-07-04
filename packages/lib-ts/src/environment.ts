import { join, ListType, serialize, serializeArray } from './helpers'
import { Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, ChainId } from './types'
import { Swap, Transfer, Call } from './intents'
import { Call as CallQuery, GetRelevantTokens, GetRelevantTokensResponse } from './queries'
import { JSON } from 'json-as/assembly'
import { Context, SerializableContext } from './context'

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
   * Tells the price of a token in USD at a specific timestamp.
   * @param token - The token to get the price of
   * @param timestamp - The timestamp for price lookup (optional, defaults to current time)
   * @returns The token price in USD
   */
  export function getPrice(token: Token, timestamp: Date | null = null): USD {
    const price = _getPrice(join([serialize(token.address), serialize(token.chainId), serialize(timestamp ? timestamp.getTime().toString() : '')]))
    return USD.fromBigInt(BigInt.fromString(price))
  }

  /**
   * Tells the balances of an address for the specified tokens and chains.
   * @param address - The address to query balances for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether to include (AllowList) or exclude (DenyList) the tokens in `tokensList` (optional, defaults to DenyList)
   * @returns Array of TokenAmount objects representing the relevant tokens
   */
  export function getRelevantTokens(
    address: Address,
    chainIds: ChainId[],
    usdMinAmount: USD = USD.zero(),
    tokensList: Token[] = [],
    listType: ListType = ListType.DenyList,
    timestamp: Date | null = null
  ): TokenAmount[] {
    const responseStr = _getRelevantTokens(JSON.stringify(GetRelevantTokens.init(address, chainIds, usdMinAmount, tokensList, listType, timestamp)))
    const response = JSON.parse<GetRelevantTokensResponse[]>(responseStr)
    return response.map<TokenAmount>((r) => r.toTokenAmount())
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
      JSON.stringify(new CallQuery(to, chainId, timestamp, data))
    )
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
