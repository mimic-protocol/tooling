import { Address, BigInt, Bytes } from './common'
import { join, serialize } from './helpers'

export * from './common'
export * from './constants'
export namespace environment {
  declare function _call(params: string): void
  declare function _swap(params: string): void
  declare function _transfer(params: string): void
  declare function _contractCall(params: string): string
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

  export function contractCall(
    target: Address,
    chainId: u64,
    blockNumber: BigInt,
    functionName: string,
    params: Bytes[]
  ): string {
    const serializedParams: (string | null)[] = []
    for (let i = 0; i < params.length; i++) {
      serializedParams.push(serialize(params[i]))
    }
    return _contractCall(
      join([
        serialize(target),
        serialize(chainId),
        serialize(blockNumber),
        serialize(functionName),
        join(serializedParams),
      ])
    )
  }

  export function getCurrentBlockNumber(chainId: u64): BigInt {
    return BigInt.fromString(_getCurrentBlockNumber(join([serialize(chainId)])))
  }
}
