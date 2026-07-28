import { environment } from '../environment'
import { EvmDynamicArg, EvmDynamicCallBuilder, IntentBuilder, SwapBuilder } from '../intents'
import { TokenAmount } from '../tokens'
import { Address, Bytes, ChainId, EvmEncodeParam } from '../types'

import { MIMIC_HELPER_ADDRESS, MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS } from './constants'

const MIMIC_HELPER = Address.fromHexString(MIMIC_HELPER_ADDRESS)
const MIMIC_PUBLIC_SMART_ACCOUNT = Address.fromHexString(MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS)

const PCT_SELECTOR = Bytes.fromHexString('0xe7032021')
const TRANSFER_SELECTOR = Bytes.fromHexString('0xa9059cbb')
const BALANCE_OF_SELECTOR = Bytes.fromHexString('0x70a08231')

const MAX_PCT_BPS: u16 = 10_000

export class Allocation {
  constructor(
    public recipient: Address,
    public pctBps: u16
  ) {}
}

/**
 * @dev Creates an IntentBuilder containing operations to swap tokens and transfer the output to multiple recipients.
 * The last recipient percentage is ignored, and will receive the remaining balance after the other allocations.
 * @param chainId The chain ID of the swap and the transfers.
 * @param amountIn The amount of tokens to swap.
 * @param minAmountOut The minimum amount of tokens to receive from the swap.
 * @param allocations An array containing a recipient address and a percentage in basis points (e.g., 50 = 0.5%, 10_000 = 100%).
 *        It represents how the output of the swap will be split among the recipients. The total allocation must add up to 10_000.
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
  let totalPctBps: u32 = 0
  for (let i = 0; i < allocations.length; i++) totalPctBps += allocations[i].pctBps
  if (totalPctBps !== MAX_PCT_BPS) throw new Error('Total allocation percentage must be 10_000 bps')

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
    const pctBps = allocations[i].pctBps
    dynamicCall1.addCall(MIMIC_HELPER, PCT_SELECTOR, [
      SWAP_OUTPUT, // amount
      EvmDynamicArg.literal([new EvmEncodeParam('uint16', pctBps.toString())], false), // percent bps
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
