import { JSON } from 'json-as/assembly'

import { CallParams, GetPriceParams, SwapParams, TransferParams } from './interfaces/environment'
import { Address, BigInt, Bytes, Token } from './common'

export * from './common'
export * from './constants'
export * from './helpers'
export { JSON } from 'json-as/assembly'

export namespace environment {
  declare function _call(params: string): void
  declare function _swap(params: string): void
  declare function _transfer(params: string): void
  declare function _getPrice(params: string): string

  export function call(
    settler: Address,
    chainId: u64,
    target: Address,
    feeToken: Address,
    feeAmount: BigInt,
    data: Bytes | null = null
  ): void {
    _call(JSON.stringify<CallParams>(new CallParams(settler, chainId, target, feeToken, feeAmount, data)))
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
      JSON.stringify<SwapParams>(
        new SwapParams(settler, chainId, tokenIn, amountIn, tokenOut, minAmountOut, destinationChainId)
      )
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
    _transfer(JSON.stringify<TransferParams>(new TransferParams(settler, chainId, token, amount, recipient, feeAmount)))
  }

  // Returns the price of a token in USD expressed in 18 decimal places
  export function getPrice(token: Token): BigInt {
    return BigInt.fromString(
      _getPrice(JSON.stringify<GetPriceParams>(new GetPriceParams(token.getAddress(), token.getChainId())))
    )
  }
}
