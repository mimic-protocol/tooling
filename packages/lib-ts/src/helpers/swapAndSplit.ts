import { EvmDynamicArg, EvmDynamicCallBuilder, IntentBuilder, SwapBuilder } from '../intents'
import { TokenAmount } from '../tokens'
import { Address, Bytes, ChainId, EvmEncodeParam } from '../types'

import { MIMIC_HELPER_ADDRESS, MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS, ONE_HUNDRED_PCT_BPS } from './constants'

const MIMIC_HELPER = Address.fromHexString(MIMIC_HELPER_ADDRESS)
const MIMIC_PUBLIC_SMART_ACCOUNT = Address.fromHexString(MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS)

const PCT_SELECTOR = Bytes.fromHexString('0xe7032021')
const TRANSFER_SELECTOR = Bytes.fromHexString('0xa9059cbb')
const BALANCE_OF_SELECTOR = Bytes.fromHexString('0x70a08231')

const MIN_ALLOCATIONS: i32 = 2

const SWAP_OP_INDEX: u32 = 0
const SWAP_OP_SUB_INDEX: u32 = 0
const PCT_OP_INDEX: u32 = 1
const BALANCE_OF_OP_INDEX: u32 = 3
const BALANCE_OF_OP_SUB_INDEX: u32 = 0

export class Allocation {
  constructor(
    public recipient: Address,
    public pctBps: u16
  ) {}
}

/**
 * @dev Creates an IntentBuilder containing operations to swap tokens and transfer the output to multiple recipients.
 * Each recipient receives the percentage of the output token specified in the allocations array.
 * The last recipient receives its specified percentage plus any remaining balance caused by rounding.
 * @param chainId The chain ID of the swap and the transfers.
 * @param amountIn The amount of tokens to swap. If the token is native, the `user` must be a smart account.
 * @param minAmountOut The minimum amount of tokens to receive from the swap. ERC20 tokens only.
 * @param allocations An array containing a recipient address and a percentage in basis points (e.g., 50 = 0.5%, 10_000 = 100%).
 *        It represents how the output of the swap will be split among the recipients. The total allocation must add up to 10_000.
 * @param user The user address for the swap (optional). If not provided, the context user will be used.
 * @param smartAccount The smart account that receives the swap output and executes the transfers (optional).
 *        If not provided, the Mimic public smart account will be used.
 * @returns An IntentBuilder object that can be used to build and send the intent.
 */
export function buildSwapAndSplit(
  chainId: ChainId,
  amountIn: TokenAmount,
  minAmountOut: TokenAmount,
  allocations: Allocation[],
  user: Address | null = null,
  smartAccount: Address = MIMIC_PUBLIC_SMART_ACCOUNT
): IntentBuilder {
  if (allocations.length < MIN_ALLOCATIONS) throw new Error(`At least ${MIN_ALLOCATIONS} allocations are required`)

  let totalPctBps: u32 = 0
  for (let i = 0; i < allocations.length; i++) totalPctBps += allocations[i].pctBps
  if (totalPctBps !== ONE_HUNDRED_PCT_BPS) {
    throw new Error(`Total allocation percentage must add up to ${ONE_HUNDRED_PCT_BPS} bps`)
  }

  const tokenOut = minAmountOut.token.address
  if (tokenOut.isNative()) throw new Error('Output token cannot be native')

  const builder = new IntentBuilder()

  const swap = SwapBuilder.forChain(chainId)
    .addTokenInFromTokenAmount(amountIn)
    .addTokenOutFromTokenAmount(minAmountOut, smartAccount)

  if (user) swap.addUser(user)

  builder.addOperationBuilder(swap)

  // Calculate the corresponding amount for each allocation, except the last one, which will receive the remaining balance
  const pctDynamicCall = EvmDynamicCallBuilder.forChain(chainId).addUser(smartAccount)
  const swapOutput = EvmDynamicArg.variable(SWAP_OP_INDEX, SWAP_OP_SUB_INDEX, false)

  for (let i = 0; i < allocations.length - 1; i++) {
    const pctBps = allocations[i].pctBps
    pctDynamicCall.addCall(MIMIC_HELPER, PCT_SELECTOR, [
      swapOutput, // amount
      EvmDynamicArg.literal([new EvmEncodeParam('uint16', pctBps.toString())], false), // percent bps
    ])
  }

  builder.addOperationBuilder(pctDynamicCall)

  // Transfer the corresponding amounts to each recipient, except the last one, which will receive the remaining balance
  const transferDynamicCall = EvmDynamicCallBuilder.forChain(chainId).addUser(smartAccount)

  for (let i = 0; i < allocations.length - 1; i++) {
    const recipient = allocations[i].recipient
    const pctOutput = EvmDynamicArg.variable(PCT_OP_INDEX, i, false)
    transferDynamicCall.addCall(tokenOut, TRANSFER_SELECTOR, [
      EvmDynamicArg.literal([new EvmEncodeParam('address', recipient.toString())], false), // to
      pctOutput, // value
    ])
  }

  builder.addOperationBuilder(transferDynamicCall)

  // Get the remaining balance
  const balanceOfDynamicCall = EvmDynamicCallBuilder.forChain(chainId).addUser(smartAccount)
  balanceOfDynamicCall.addCall(tokenOut, BALANCE_OF_SELECTOR, [
    EvmDynamicArg.literal([new EvmEncodeParam('address', smartAccount.toString())], false), // account
  ])

  builder.addOperationBuilder(balanceOfDynamicCall)

  // Transfer the remaining balance to the last recipient
  const lastTransferDynamicCall = EvmDynamicCallBuilder.forChain(chainId).addUser(smartAccount)
  const lastRecipient = allocations[allocations.length - 1].recipient
  const balanceOfOutput = EvmDynamicArg.variable(BALANCE_OF_OP_INDEX, BALANCE_OF_OP_SUB_INDEX, false)

  lastTransferDynamicCall.addCall(tokenOut, TRANSFER_SELECTOR, [
    EvmDynamicArg.literal([new EvmEncodeParam('address', lastRecipient.toString())], false), // to
    balanceOfOutput, // value
  ])

  builder.addOperationBuilder(lastTransferDynamicCall)

  return builder
}
