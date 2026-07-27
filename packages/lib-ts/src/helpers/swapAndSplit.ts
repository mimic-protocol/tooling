import { environment } from '../environment'
import { EvmDynamicArg, EvmDynamicCallBuilder, IntentBuilder, SwapBuilder } from '../intents'
import { TokenAmount } from '../tokens'
import { Address, Bytes, ChainId, EvmEncodeParam } from '../types'

import { MIMIC_HELPER_ADDRESS, MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS } from './constants'

const MIMIC_HELPER = Address.fromHexString(MIMIC_HELPER_ADDRESS)
const MIMIC_PUBLIC_SMART_ACCOUNT = Address.fromHexString(MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS)

export function buildSwapAndSplit(
  chainId: ChainId,
  tokenIn: TokenAmount,
  tokenOut: TokenAmount,
  recipients: Address[],
  pcts: u8[],
  user: Address | null = null
): IntentBuilder {
  if (recipients.length != pcts.length + 1) throw new Error('Recipients must have one more element than pcts')
  if (recipients.length <= 1) throw new Error('More than 1 recipient needed')

  const builder = new IntentBuilder()

  const swap = SwapBuilder.forChain(chainId)
    .addUser(user || environment.getContext().user)
    .addTokenInFromTokenAmount(tokenIn)
    .addTokenOutFromTokenAmount(tokenOut, MIMIC_PUBLIC_SMART_ACCOUNT)

  builder.addOperationBuilder(swap)

  const SWAP_OUTPUT = EvmDynamicArg.variable(0, 0, false)
  const pctSelector = Bytes.fromHexString('0x73d9f5d0')
  const dynamicCall1 = EvmDynamicCallBuilder.forChain(chainId).addUser(MIMIC_PUBLIC_SMART_ACCOUNT)

  for (let i = 0; i < pcts.length; i++) {
    const pct = pcts[i]
    dynamicCall1.addCall(MIMIC_HELPER, pctSelector, [
      SWAP_OUTPUT, // amount
      EvmDynamicArg.literal([new EvmEncodeParam('uint8', pct.toString())], false), // percent
    ])
  }
  // last % with remainder
  const pctRemainderSelector = Bytes.fromHexString('0x05702f4f')
  dynamicCall1.addCall(MIMIC_HELPER, pctRemainderSelector, [
    SWAP_OUTPUT, // amount
    EvmDynamicArg.literal(
      [
        EvmEncodeParam.fromValues(
          'uint8[]',
          pcts.map((pct: u8) => new EvmEncodeParam('uint8', pct.toString()))
        ),
      ],
      true
    ), //pct[]
  ])

  builder.addOperationBuilder(dynamicCall1)

  const transferSelector = Bytes.fromHexString('0xa9059cbb')
  const dynamicCall2 = EvmDynamicCallBuilder.forChain(chainId).addUser(MIMIC_PUBLIC_SMART_ACCOUNT)

  for (let i = 0; i < recipients.length; i++) {
    const target = tokenOut.token.address
    const recipient = recipients[i]
    dynamicCall2.addCall(target, transferSelector, [
      EvmDynamicArg.literal([new EvmEncodeParam('address', recipient.toString())], false), // to
      EvmDynamicArg.variable(1, i, false), // value ( dynamicCall1 sub 'i' result )
    ])
  }

  builder.addOperationBuilder(dynamicCall2)

  return builder
}
