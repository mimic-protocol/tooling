import { join, ListType, serialize, serializeArray } from './helpers'
import { Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, ChainId } from './types'
import { Swap, Transfer, Call } from './intents'
import { Call as CallQuery } from './queries'
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
   * Executes a Call intent containing contract calls on the blockchain.
   * @param call - The Call intent to execute
   */
  export function call(call: Call): void {
    _call(JSON.stringify(call))
  }

  /**
   * Executes a Swap intent for token exchange operations.
   * @param swap - The Swap intent to execute
   */
  export function swap(swap: Swap): void {
    _swap(JSON.stringify(swap))
  }

  /**
   * Executes a Transfer intent for sending tokens to recipients.
   * @param transfer - The Transfer intent to execute
   */
  export function transfer(transfer: Transfer): void {
    _transfer(JSON.stringify(transfer))
  }

  /**
   * Gets the price of a token in USD at a specific timestamp.
   * @param token - The token to get the price for
   * @param timestamp - The timestamp for price lookup (optional, defaults to current time)
   * @returns The token price in USD
   */
  export function getPrice(token: Token, timestamp: Date | null = null): USD {
    const price = _getPrice(join([serialize(token.address), serialize(token.chainId), serialize(timestamp ? timestamp.getTime().toString() : '')]))
    return USD.fromBigInt(BigInt.fromString(price))
  }

  /**
   * Gets relevant token amounts for an address across specified chains.
   * @param address - The wallet address to query tokens for
   * @param chainIds - Array of chain ids to search
   * @param usdMinAmount - Minimum USD value threshold for tokens (optional, defaults to zero)
   * @param tokensList - List of tokens to include/exclude (optional, defaults to empty array)
   * @param listType - Whether tokensList is a DenyList or AllowList (optional, defaults to DenyList)
   * @returns Array of TokenAmount objects representing the relevant tokens
   */
  export function getRelevantTokens(
    address: Address,
    chainIds: ChainId[],
    usdMinAmount: USD = USD.zero(),
    tokensList: Token[] = [],
    listType: ListType = ListType.DenyList
  ): TokenAmount[] {
    const response = _getRelevantTokens(
      // NOTE: The runner expects an optional timestamp that the user will not be able to input
      // that's why serialize('') is used
      // this is a workaround until a decision is made regarding the timestamp
      join([serialize(address), serializeArray(chainIds), serialize(usdMinAmount.value), serializeArray(tokensList), serialize(listType), serialize('')])
    )
    const rows = response.split('\n')
    const tokenAmounts: TokenAmount[] = []

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].length === 0) continue
      tokenAmounts.push(TokenAmount.parse(rows[i]))
    }

    return tokenAmounts
  }

  /**
   * Executes a contract call of a read function on the blockchain and returns the result.
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
   * Gets the current execution context containing user and environment information.
   * @returns The Context object with user address and other environment data
   */
  export function getContext(): Context {
    const context = JSON.parse<SerializableContext>(_getContext())
    return Context.fromSerializable(context)
  }
}
