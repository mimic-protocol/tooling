import { join, ListType, serialize, serializeArray } from './helpers'
import { Token, TokenAmount, USD } from './tokens'
import { Address, BigInt } from './types'
import { Swap, TokenIn, TokenOut, Transfer, TransferData, Call, CallData } from "./intents";
import { JSON } from 'json-as/assembly'
import { Context } from "./context";

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

  export function call(
    calls: CallData[],
    feeTokenAmount: TokenAmount,
    chainId: u64,
    settler: Address | null = null,
    deadline: BigInt | null = null,
  ): void {
    if(feeTokenAmount.token.chainId !== chainId) throw new Error('Fee token must be on the same chain as the calls')

    _call(
      JSON.stringify(new Call(calls, feeTokenAmount.token.address, feeTokenAmount.amount, chainId, settler, deadline))
    )
  }

  export function swap(
    tokensIn: TokenAmount[],
    tokensOut: TokenAmount[],
    recipient: Address,
    chainId: u64,
    settler: Address | null = null,
    deadline: BigInt | null = null,
  ): void {
    if(tokensIn.length === 0 || tokensOut.length === 0) throw new Error('Tokens in and out are required')

    const sourceChainId = tokensIn[0].token.chainId

    for(let i = 1; i < tokensIn.length; i++) {
      if(tokensIn[i].token.chainId !== sourceChainId) throw new Error('All tokens in must be on the same chain')
    }

    for(let i = 1; i < tokensOut.length; i++) {
      if(tokensOut[i].token.chainId !== chainId) throw new Error('All tokens out must be on the same chain')
    }
    
    const _tokensIn = tokensIn.map<TokenIn>(tokenIn => TokenIn.fromTokenAmount(tokenIn))
    const _tokensOut: TokenOut[] = []
    for(let i = 0; i < tokensOut.length; i++) _tokensOut.push(TokenOut.fromTokenAmount(tokensOut[i], recipient))

    _swap(JSON.stringify(new Swap(sourceChainId, _tokensIn, _tokensOut, chainId, settler, deadline)))
  }

  export function transfer(
    tokenAmounts: TokenAmount[],
    recipient: Address,
    feeTokenAmount: TokenAmount,
    chainId: u64,
    settler: Address | null = null,
    deadline: BigInt | null = null,
  ): void {
    for(let i = 1; i < tokenAmounts.length; i++) {
      if(tokenAmounts[i].token.chainId !== chainId) throw new Error('All tokens must be on the same chain')
    }

    if(feeTokenAmount.token.chainId !== chainId) throw new Error('Fee token must be on the same chain as the tokens')

    const transfers: TransferData[] = []
    for(let i = 0; i < tokenAmounts.length; i++) transfers.push(TransferData.fromTokenAmount(tokenAmounts[i], recipient))

    _transfer(JSON.stringify(new Transfer(transfers, feeTokenAmount.token.address, feeTokenAmount.amount, feeTokenAmount.token.chainId, settler, deadline))
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

  export function getContext(): Context {
    return JSON.parse<Context>(_getContext());
  }
}
