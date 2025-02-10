import { Address, BigInt, Bytes, environment } from '@mimicprotocol/lib-ts'

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

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

  environment.createCallIntent(settler, chainId, target, data, feeToken, feeAmount)
  environment.createSwapIntent(settler, chainId, tokenIn, tokenOut, amountIn, minAmountOut)
  environment.createBridgeIntent(settler, chainId, tokenIn, amountIn, destinationChainId, tokenOut, minAmountOut)
  environment.createTransferIntent(settler, chainId, tokenIn, amountIn, recipient, feeAmount)
}
