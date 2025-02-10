import { Address, BigInt, Bytes } from './common'

export * from './common'
export declare namespace environment {
  function getValue(): i32
  function createIntent(intent: i32): void
  function createCallIntent(
    settler: Address,
    chainId: u64,
    target: Address,
    data: Bytes,
    feeToken: Address,
    feeAmount: BigInt
  ): void
  function createSwapIntent(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: BigInt,
    minAmountOut: BigInt
  ): void
  function createBridgeIntent(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    amountIn: BigInt,
    destinationChainId: u64,
    tokenOut: Address,
    minAmountOut: BigInt
  ): void
  function createTransferIntent(
    settler: Address,
    sourceChainId: u64,
    token: Address,
    amount: BigInt,
    recipient: Address,
    feeAmount: BigInt
  ): void
}
