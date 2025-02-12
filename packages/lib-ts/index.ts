import { Address, BigInt, Bytes } from './common'

export * from './common'
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
declare namespace environment {
  function getValue(): i32
  function calculate(a: i32, b: i32): i32
  function createIntent(intent: i32): void
  function call(settler: string, chainId: u64, target: string, data: string, feeToken: string, feeAmount: string): void
  function swap(
    settler: string,
    chainId: u64,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string
  ): void
  function bridge(
    settler: string,
    sourceChainId: u64,
    tokenIn: string,
    amountIn: string,
    destinationChainId: u64,
    tokenOut: string,
    minAmountOut: string
  ): void
  function transfer(
    settler: string,
    chainId: u64,
    token: string,
    amount: string,
    recipient: string,
    feeAmount: string
  ): void
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
    data: Bytes,
    feeToken: Address,
    feeAmount: BigInt
  ): void {
    const _settler = settler.toHexString()
    const _chainId = chainId
    const _target = target.toHexString()
    const _data = data.toHexString()
    const _feeToken = feeToken.toHexString()
    const _feeAmount = feeAmount.toString()
    environment.call(_settler, _chainId, _target, _data, _feeToken, _feeAmount)
  }
  static swap(
    settler: Address,
    chainId: u64,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: BigInt,
    minAmountOut: BigInt
  ): void {
    const _settler = settler.toHexString()
    const _chainId = chainId
    const _tokenIn = tokenIn.toHexString()
    const _tokenOut = tokenOut.toHexString()
    const _amountIn = amountIn.toString()
    const _minAmountOut = minAmountOut.toString()
    environment.swap(_settler, _chainId, _tokenIn, _tokenOut, _amountIn, _minAmountOut)
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
    const _settler = settler.toHexString()
    const _sourceChainId = sourceChainId
    const _tokenIn = tokenIn.toHexString()
    const _amountIn = amountIn.toString()
    const _destinationChainId = destinationChainId
    const _tokenOut = tokenOut.toHexString()
    const _minAmountOut = minAmountOut.toString()

    environment.bridge(_settler, _sourceChainId, _tokenIn, _amountIn, _destinationChainId, _tokenOut, _minAmountOut)
  }
  static transfer(
    settler: Address,
    chainId: u64,
    token: Address,
    amount: BigInt,
    recipient: Address,
    feeAmount: BigInt
  ): void {
    const _settler = settler.toHexString()
    const _chainId = chainId
    const _token = token.toHexString()
    const _amount = amount.toString()
    const _recipient = recipient.toHexString()
    const _feeAmount = feeAmount.toString()

    environment.transfer(_settler, _chainId, _token, _amount, _recipient, _feeAmount)
  }
}

export declare namespace oracle {
  function getETHPrice(): i32
}
