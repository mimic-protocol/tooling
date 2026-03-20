import { Address, Bytes, ERC20Token, EvmCallBuilder, NULL_ADDRESS, TokenAmount } from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const token = ERC20Token.fromString(NULL_ADDRESS, inputs.chainId)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()

  const fee1 = TokenAmount.fromI32(token, 10)
  EvmCallBuilder.forChain(inputs.chainId).addCall(target, data).send(fee1)

  const fee2 = fee1.minus(TokenAmount.fromI32(token, 1))
  EvmCallBuilder.forChain(inputs.chainId).addCall(target, data).send(fee2)

  const fee3 = fee1.minus(TokenAmount.fromI32(token, 2))
  EvmCallBuilder.forChain(inputs.chainId).addCall(target, data).send(fee3)
}
