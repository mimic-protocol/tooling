import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = new Token(NULL_ADDRESS, inputs.chainId, 18, 'TEST')
  const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromI32(2))
  const feeTokenAmount1 = feeTokenAmount.minus(new TokenAmount(feeToken, BigInt.fromI32(1)))
  const feeTokenAmount2 = feeTokenAmount.minus(new TokenAmount(feeToken, BigInt.fromI32(2)))
  environment.call([new CallData(target, data)], feeTokenAmount, inputs.chainId, settler)
  environment.call([new CallData(target, data)], feeTokenAmount1, inputs.chainId, settler)
  environment.call([new CallData(target, data)], feeTokenAmount2, inputs.chainId, settler)
}
