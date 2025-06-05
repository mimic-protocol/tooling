import {
  Address,
  BigInt,
  Bytes,
  CallData,
  environment,
  NULL_ADDRESS,
  Token,
  TokenIn,
  TokenOut,
} from '@mimicprotocol/lib-ts'
import { TransferData } from '@mimicprotocol/lib-ts/src/intents/Transfer'

import { inputs } from './types'

export default function main(): void {
  // Token definitions
  const USDC = new Token('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1, 6, 'USDC')
  const WBTC = new Token('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 1, 8, 'WBTC')

  // Call without bytes (optional field)
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString('0x0000000000000000000000000000000000000001')
  const chainId = inputs.chainId
  environment.call([new CallData(target)], USDC.address, inputs.amount, chainId, settler)

  // Call with bytes
  const bytes = Bytes.fromI32(123)
  environment.call([new CallData(target, bytes)], USDC.address, inputs.amount, chainId, settler)

  // Cross-chain swap
  const minAmountOut = inputs.amount.times(BigInt.fromI32(inputs.slippage)).div(BigInt.fromI32(100))
  const destChain = 10
  environment.swap(
    chainId,
    [new TokenIn(USDC.address, inputs.amount)],
    [new TokenOut(WBTC.address, minAmountOut, target)],
    destChain,
    settler
  )

  // Normal Transfer
  environment.transfer(
    [new TransferData(USDC.address, inputs.amount, target)],
    USDC.address,
    inputs.amount,
    chainId,
    settler
  )
}
