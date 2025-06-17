import { join, ListType, serialize, serializeArray } from './helpers'
import { Token, TokenAmount, USD } from './tokens'
import { Address, BigInt } from './types'
import { Swap, TokenIn, TokenOut, Transfer, TransferData, Call, CallData } from "./intents";
import { Call as CallQuery } from "./queries";
import { JSON } from 'json-as/assembly'
import { Context, SerializableContext } from "./context";

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

  export function call(intent: Call): void {
    _call(JSON.stringify(intent))
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
    chainIds: u64[],
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

  export function contractCall(
    to: Address,
    chainId: u64,
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
