import { join, ListType, serialize, serializeArray } from './helpers'
import { Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, EvmEncodeParam, EvmDecodeParam } from './types'
import { Swap, TokenIn, TokenOut, Transfer, TransferData, Call, CallData } from "./intents";
import { JSON } from 'json-as/assembly'

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

  @external('environment', '_evmEncode')
  declare function _evmEncode(params: string): string

  @external('environment', '_evmDecode')
  declare function _evmDecode(params: string): string

  export function call(
    calls: CallData[],
    feeToken: Address,
    feeAmount: BigInt,
    settler: Address | null = null,
    deadline: BigInt | null = null,
  ): void {
    _call(
      JSON.stringify(new Call(calls, feeToken, feeAmount, settler, deadline))
    )
  }

  export function swap(
    chainId: u64,
    tokensIn: TokenIn[],
    tokensOut: TokenOut[],
    destinationChainId: u64 = chainId,
    settler: Address | null = null,
    deadline: BigInt | null = null,
  ): void {
    _swap(JSON.stringify(new Swap(chainId, tokensIn, tokensOut, destinationChainId, settler, deadline)))
  }

  export function transfer(
    transfers: TransferData[],
    feeToken: Address,
    feeAmount: BigInt,
    settler: Address | null = null,
    deadline: BigInt | null = null,
  ): void {
    _transfer(JSON.stringify(new Transfer(transfers, feeToken, feeAmount, settler, deadline))
    )
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
    target: Address,
    chainId: u64,
    timestamp: Date | null,
    callData: string
  ): string {
    return _contractCall(
      join([
        serialize(target),
        serialize(chainId),
        serialize(timestamp ? timestamp.getTime().toString() : ''),
        serialize(callData),
      ])
    )
  }

  export function evmEncode(callParameters: EvmEncodeParam[]): string {
    return _evmEncode(join([serializeArray(callParameters)]))
  }

  export function evmDecode(encodedData: EvmDecodeParam): string {
    return _evmDecode(serialize(encodedData))
  }
}
