import { Address, Bytes, CallBuilder, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const token = Token.fromString(NULL_ADDRESS, inputs.chainId)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()

  const fee1 = TokenAmount.fromI32(token, 10)
  CallBuilder.forChainWithFee(inputs.chainId, fee1).addCall(target, data).build().send()

  const fee2 = fee1.minus(TokenAmount.fromI32(token, 1))
  CallBuilder.forChainWithFee(inputs.chainId, fee2).addCall(target, data).build().send()

  const fee3 = fee1.minus(TokenAmount.fromI32(token, 2))
  CallBuilder.forChainWithFee(inputs.chainId, fee3).addCall(target, data).build().send()
}
