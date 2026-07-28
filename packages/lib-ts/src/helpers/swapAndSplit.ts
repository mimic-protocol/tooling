import { environment } from '../environment'
import { EvmDynamicArg, EvmDynamicCallBuilder, IntentBuilder, SwapBuilder } from '../intents'
import { TokenAmount } from '../tokens'
import { Address, Bytes, ChainId, EvmEncodeParam } from '../types'

import { MIMIC_HELPER_ADDRESS, MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS } from './constants'

const MIMIC_HELPER = Address.fromHexString(MIMIC_HELPER_ADDRESS)
const MIMIC_PUBLIC_SMART_ACCOUNT = Address.fromHexString(MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS)

const PCT_SELECTOR = Bytes.fromHexString('0x73d9f5d0')
const TRANSFER_SELECTOR = Bytes.fromHexString('0xa9059cbb')
const BALANCE_OF_SELECTOR = Bytes.fromHexString('0x70a08231')

export class Allocation {
  constructor(
    public recipient: Address,
    public pct: u8
  ) {}
}

/**
 * Creates an IntentBuilder containing operations to swap tokens and split the output to multiple recipients.
 * The last recipient percentage is ignored, and will receive the remaining balance after the other allocations.
 * @param chainId The chain ID of the swap.
 * @param amountIn The amount of tokens to swap.
 * @param minAmountOut The minimum amount of tokens to receive from the swap.
 * @param allocations An array containing a recipient address and a percentage (0-100).
 *        It represents how the output of the swap will be split among the recipients.
 * @param user The user address for the swap (optional). If not provided, the context user will be used.
 * @returns An IntentBuilder object that can be used to build and send the intent.
 */
export function buildSwapAndSplit(
  chainId: ChainId,
  amountIn: TokenAmount,
  minAmountOut: TokenAmount,
  allocations: Allocation[],
  user: Address | null = null
): IntentBuilder {
  const totalPct = allocations.reduce<u8>((total, allocation) => total + allocation.pct, 0)
  if (totalPct !== 100) throw new Error('Total allocation percentage must be 100')

  const builder = new IntentBuilder()

  const swap = SwapBuilder.forChain(chainId)
    .addUser(user || environment.getContext().user)
    .addTokenInFromTokenAmount(amountIn)
    .addTokenOutFromTokenAmount(minAmountOut, MIMIC_PUBLIC_SMART_ACCOUNT)

  builder.addOperationBuilder(swap)

  // Calculate the corresponding amount for each allocation, except the last one
  const SWAP_OUTPUT = EvmDynamicArg.variable(0, 0, false)
  const dynamicCall1 = EvmDynamicCallBuilder.forChain(chainId).addUser(MIMIC_PUBLIC_SMART_ACCOUNT)

  for (let i = 0; i < allocations.length - 1; i++) {
    const pct = allocations[i].pct
    dynamicCall1.addCall(MIMIC_HELPER, PCT_SELECTOR, [
      SWAP_OUTPUT, // amount
      EvmDynamicArg.literal([new EvmEncodeParam('uint8', pct.toString())], false), // percent
    ])
  }

  builder.addOperationBuilder(dynamicCall1)

  // Transfer the corresponding amounts to each recipient, except the last one
  const dynamicCall2 = EvmDynamicCallBuilder.forChain(chainId).addUser(MIMIC_PUBLIC_SMART_ACCOUNT)

  for (let i = 0; i < allocations.length - 1; i++) {
    const target = minAmountOut.token.address
    const recipient = allocations[i].recipient
    dynamicCall2.addCall(target, TRANSFER_SELECTOR, [
      EvmDynamicArg.literal([new EvmEncodeParam('address', recipient.toString())], false), // to
      EvmDynamicArg.variable(1, i, false), // value (dynamicCall1 sub 'i' result)
    ])
  }

  builder.addOperationBuilder(dynamicCall2)

  // Get the remaining balance
  const dynamicCall3 = EvmDynamicCallBuilder.forChain(chainId).addUser(MIMIC_PUBLIC_SMART_ACCOUNT)
  dynamicCall3.addCall(minAmountOut.token.address, BALANCE_OF_SELECTOR, [
    EvmDynamicArg.literal([new EvmEncodeParam('address', MIMIC_PUBLIC_SMART_ACCOUNT.toString())], false), // account
  ])

  builder.addOperationBuilder(dynamicCall3)

  // Transfer the remaining balance to the last recipient
  const lastRecipient = allocations[allocations.length - 1].recipient
  const dynamicCall4 = EvmDynamicCallBuilder.forChain(chainId).addUser(MIMIC_PUBLIC_SMART_ACCOUNT)
  dynamicCall4.addCall(minAmountOut.token.address, TRANSFER_SELECTOR, [
    EvmDynamicArg.literal([new EvmEncodeParam('address', lastRecipient.toString())], false), // to
    EvmDynamicArg.variable(3, 0, false), // value (dynamicCall3 result)
  ])

  builder.addOperationBuilder(dynamicCall4)

  return builder
}
