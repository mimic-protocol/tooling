import { Address, BigInt, Bytes } from './common'

export * from './common'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export declare namespace environment {
  function createCall(
    settler: Address,
    chainId: u64,
    target: Address,
    data: Bytes,
    feeToken: Address,
    feeAmount: BigInt
  ): void
  function createSwap(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: BigInt,
    minAmountOut: BigInt
  ): void
  function createBridge(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    amountIn: BigInt,
    destinationChainId: u64,
    tokenOut: Address,
    minAmountOut: BigInt
  ): void
  function createTransfer(
    settler: Address,
    sourceChainId: u64,
    token: Address,
    amount: BigInt,
    recipient: Address,
    feeAmount: BigInt
  ): void
}
