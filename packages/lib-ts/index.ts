import { JSON } from 'json-as/assembly'

import { CallParams, SwapParams, TransferParams } from './interfaces/environment'
import { Address, BigInt, Bytes } from './common'

export * from './common'
export * from './constants'
export { JSON } from 'json-as/assembly'

export namespace environment {
  declare function _call(params: string): void
  declare function _swap(params: string): void
  declare function _transfer(params: string): void

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
}
