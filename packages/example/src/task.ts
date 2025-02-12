import { Address, BigInt, Bytes, environment, ByteArray, NULL_ADDRESS } from '@mimicprotocol/lib-ts'


export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 137

  const target = Address.fromString(NULL_ADDRESS)
  const byteArray = new ByteArray(4)
  byteArray[0] = 1
  byteArray[1] = 2
  byteArray[2] = 3
  byteArray[3] = 4
  const data = Bytes.fromByteArray(byteArray)
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.fromString('1.2e18')

  // const tokenIn = Address.fromString(NULL_ADDRESS)
  // const tokenOut = Address.fromString(NULL_ADDRESS)
  // const amountIn = BigInt.zero()
  // const minAmountOut = BigInt.zero()
  // const destinationChainId = 137
  // const recipient = Address.fromString(NULL_ADDRESS)

  environment.call(settler, chainId, target, data, feeToken, feeAmount)
  // environment.swap(settler, chainId, tokenIn, tokenOut, amountIn, minAmountOut)
  // environment.bridge(settler, chainId, tokenIn, amountIn, destinationChainId, tokenOut, minAmountOut)
  // environment.transfer(settler, chainId, tokenIn, amountIn, recipient, feeAmount)
}
