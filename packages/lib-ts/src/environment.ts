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

  export function call(call: Call): void {
    _call(JSON.stringify(call))
  }

  export function swap(swap: Swap): void {
    _swap(JSON.stringify(swap))
  }

  export function transfer(transfer: Transfer): void {
    _transfer(JSON.stringify(transfer))
  }

  // Returns the price of a token in USD expressed in 18 decimal places
  export function getPrice(token: Token, timestamp: Date | null = null): USD {
    const price = _getPrice(join([serialize(token.address), serialize(token.chainId), serialize(timestamp ? timestamp.getTime().toString() : '')]))
    return USD.fromBigInt(BigInt.fromString(price))
  }

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

  export function getContext(): Context {
    const context = JSON.parse<SerializableContext>(_getContext())
    return Context.fromSerializable(context)
  }
}
