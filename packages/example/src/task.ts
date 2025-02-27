import { Address, BigInt, ByteArray, Bytes, convertAmountBetweenTokens, convertTokenAmountToUsd, environment, NULL_ADDRESS, Token } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 137

  const target = Address.fromString(NULL_ADDRESS)
  const byteArray = new ByteArray(4)
  byteArray[0] = 1
  byteArray[1] = 2
  byteArray[2] = 3
  byteArray[3] = 4
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.fromString('1.2e18')
  const data = Bytes.fromByteArray(byteArray)

  const tokenIn = Address.fromString(NULL_ADDRESS)
  const tokenOut = Address.fromString(NULL_ADDRESS)
  const amountIn = BigInt.zero()
  const minAmountOut = BigInt.zero()
  const destinationChainId = 1
  const recipient = Address.fromString(NULL_ADDRESS)

  environment.call(settler, chainId, target, feeToken, feeAmount, data)
  environment.call(settler, chainId, target, feeToken, feeAmount) // createCall with optional data
  environment.swap(settler, chainId, tokenIn, amountIn, tokenOut, minAmountOut, destinationChainId)
  environment.transfer(settler, chainId, tokenIn, amountIn, recipient, feeAmount)

  const usdcToken = new Token('USDC', Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), 1, 6)
  const ethToken = new Token('ETH', Address.fromString('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'), 1, 18)

  const usdcAmount = BigInt.fromI32(100).times(BigInt.fromI32(10).pow(usdcToken.decimals))
  const usdcAmountInUsd = convertTokenAmountToUsd(usdcToken, usdcAmount)
  console.log('usdcAmountInUsd: ' + usdcAmountInUsd.toString())

  const ethAmountFromUsdc = convertAmountBetweenTokens(usdcAmount, usdcToken, ethToken)
  console.log('ethAmountFromUsdc: ' + ethAmountFromUsdc.toString())
}
