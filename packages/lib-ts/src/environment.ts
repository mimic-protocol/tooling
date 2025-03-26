import { join, ListType, serialize, serializeArray } from './helpers'
import { Token, TokenAmount, USD } from './tokens'
import { Address, BigInt, Bytes } from './types'

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

  @external('environment', '_getCurrentBlockNumber')
  declare function _getCurrentBlockNumber(params: string): string

  export function call(
    settler: Address,
    chainId: u64,
    target: Address,
    feeToken: Address,
    feeAmount: BigInt,
    data: Bytes | null = null
  ): void {
    _call(
      join([
        serialize(settler),
        serialize(chainId),
        serialize(target),
        serialize(feeToken),
        serialize(feeAmount),
        data ? serialize(data as Bytes) : null,
      ])
    )
  }

  export function swap(
    settler: Address,
    chainId: u64,
    tokenIn: Address,
    amountIn: BigInt,
    tokenOut: Address,
    minAmountOut: BigInt,
    destinationChainId: u64 = chainId
  ): void {
    _swap(
      join([
        serialize(settler),
        serialize(chainId),
        serialize(tokenIn),
        serialize(amountIn),
        serialize(tokenOut),
        serialize(minAmountOut),
        serialize(destinationChainId),
      ])
    )
  }

  export function transfer(
    settler: Address,
    chainId: u64,
    token: Address,
    amount: BigInt,
    recipient: Address,
    feeAmount: BigInt
  ): void {
    _transfer(
      join([
        serialize(settler),
        serialize(chainId),
        serialize(token),
        serialize(amount),
        serialize(recipient),
        serialize(feeAmount),
      ])
    )
  }

  // Returns the price of a token in USD expressed in 18 decimal places
  export function getPrice(token: Token): USD {
    const price = _getPrice(join([serialize(token.address), serialize(token.chainId)]))
    return USD.fromBigInt(BigInt.fromString(price))
  }

  // TODO: Implement missing filters (chaindId list, allowList/denyList)
  export function getRelevantTokens(
    address: Address,
    chainIds: u64[],
    usdMinAmount: USD = USD.zero(),
    tokensList: Token[] = [],
    listType: ListType = ListType.AllowList
  ): TokenAmount[] {
    const response = _getRelevantTokens(
      join([serialize(address), serializeArray(chainIds), serialize(usdMinAmount.value), serializeArray(tokensList), serialize(listType)])
    )
    const rows = response.split('\n')
    const tokenAmounts: TokenAmount[] = []

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].length === 0) continue

      tokenAmounts.push(TokenAmount.deserialize(rows[i]))
    }

    return tokenAmounts
  }

  export function contractCall(
    target: Address,
    chainId: u64,
    blockNumber: BigInt,
    functionName: string,
    params: Bytes[]
  ): string {
    return _contractCall(
      join([
        serialize(target),
        serialize(chainId),
        serialize(blockNumber),
        serialize(functionName),
        serializeArray(params),
      ])
    )
  }

  export function getCurrentBlockNumber(chainId: u64): BigInt {
    return BigInt.fromString(_getCurrentBlockNumber(join([serialize(chainId)])))
  }
}
