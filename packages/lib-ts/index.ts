import { JSON } from 'json-as/assembly'

import { BridgeParams, CallParams, SwapParams, TransferParams } from './interfaces/environment'
import { Address, BigInt, Bytes } from './common'

export * from './common'
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
declare namespace environment {
  function getValue(): i32
  function calculate(a: i32, b: i32): i32
  function createIntent(intent: i32): void

  function call(params: string): void
  function swap(params: string): void
  function bridge(params: string): void
  function transfer(params: string): void
}

export class Environment {
  static getValue(): i32 {
    return environment.getValue()
  }

  static createIntent(intent: i32): void {
    environment.createIntent(intent)
  }

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
    tokenOut: Address,
    amountIn: BigInt,
    minAmountOut: BigInt
  ): void {
    environment.swap(
      JSON.stringify<SwapParams>(new SwapParams(settler, chainId, tokenIn, tokenOut, amountIn, minAmountOut))
    )
  }
  static bridge(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    amountIn: BigInt,
    destinationChainId: u64,
    tokenOut: Address,
    minAmountOut: BigInt
  ): void {
    environment.bridge(
      JSON.stringify<BridgeParams>(
        new BridgeParams(settler, sourceChainId, tokenIn, amountIn, destinationChainId, tokenOut, minAmountOut)
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
