import { JSON } from 'json-as/assembly'

import { CallParams, SwapParams, TransferParams } from './interfaces/environment'
import { Address, BigInt, Bytes } from './common'

export * from './common'
export * from './constants'

declare namespace environment {
  function call(params: string): void
  function swap(params: string): void
  function transfer(params: string): void
}

export class Environment {
  static call(
    settler: Address,
    chainId: u64,
    target: Address,
    feeToken: Address,
    feeAmount: BigInt,
    data: Bytes | null = null
  ): void {
    environment.call(JSON.stringify<CallParams>(new CallParams(settler, chainId, target, feeToken, feeAmount, data)))
  }

  static swap(
    settler: Address,
    chainId: u64,
    tokenIn: Address,
    amountIn: BigInt,
    tokenOut: Address,
    minAmountOut: BigInt,
    destinationChainId: u64 = chainId
  ): void {
    environment.swap(
      JSON.stringify<SwapParams>(
        new SwapParams(settler, chainId, tokenIn, amountIn, tokenOut, minAmountOut, destinationChainId)
      )
    )
  }

  static transfer(
    settler: Address,
    chainId: u64,
    token: Address,
    amount: BigInt,
    recipient: Address,
    feeAmount: BigInt
  ): void {
    environment.transfer(
      JSON.stringify<TransferParams>(new TransferParams(settler, chainId, token, amount, recipient, feeAmount))
    )
  }
}
