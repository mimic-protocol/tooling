import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'


export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1

  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.zero()

  const tokenIn = Address.fromString(NULL_ADDRESS)
  const tokenOut = Address.fromString(NULL_ADDRESS)
  const amountIn = BigInt.zero()
  const minAmountOut = BigInt.zero()
  const destinationChainId = 137
  const recipient = Address.fromString(NULL_ADDRESS)

  environment.createCall(settler, chainId, target, data, feeToken, feeAmount)
  environment.createSwap(settler, chainId, tokenIn, tokenOut, amountIn, minAmountOut)
  environment.createBridge(settler, chainId, tokenIn, amountIn, destinationChainId, tokenOut, minAmountOut)
  environment.createTransfer(settler, chainId, tokenIn, amountIn, recipient, feeAmount)
}
