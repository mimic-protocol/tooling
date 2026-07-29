import { buildSwapAndSplit } from '../../src/helpers'
import { MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS } from '../../src/helpers/constants'
import { Allocation } from '../../src/helpers/swapAndSplit'
import { EvmDynamicCall, OperationType, Swap } from '../../src/intents'
import { ERC20Token, TokenAmount } from '../../src/tokens'
import { Address } from '../../src/types'
import { randomSettler, setContext, setEvmEncode } from '../helpers'

const chainId = 1
const user = Address.fromString('0x0000000000000000000000000000000000000001')
const recipient1 = Address.fromString('0x0000000000000000000000000000000000000002')
const recipient2 = Address.fromString('0x0000000000000000000000000000000000000003')
const recipient3 = Address.fromString('0x0000000000000000000000000000000000000004')
const tokenIn = ERC20Token.fromAddress(
  Address.fromString('0x0000000000000000000000000000000000000010'),
  chainId,
  6,
  'USDC'
)
const tokenOut = ERC20Token.fromAddress(
  Address.fromString('0x0000000000000000000000000000000000000020'),
  chainId,
  18,
  'DAI'
)
const amountIn = TokenAmount.fromStringDecimal(tokenIn, '10')
const minAmountOut = TokenAmount.fromStringDecimal(tokenOut, '100')

describe('buildSwapAndSplit', () => {
  beforeEach(() => {
    setContext(1, 1, user.toString(), [randomSettler(chainId)], 'trigger-123')

    setEvmEncode('uint256', '0', '0x1000') // Dynamic variable 0
    setEvmEncode('uint256', '1', '0x1001') // Dynamic variable 1
    setEvmEncode('uint256', '3', '0x1003') // Dynamic variable 3

    setEvmEncode('uint16', '9050', '0x9050')
    setEvmEncode('uint16', '125', '0x0125')

    setEvmEncode('address', MIMIC_PUBLIC_SMART_ACCOUNT_ADDRESS, '0x2000')
    setEvmEncode('address', recipient1.toString(), '0x2001')
    setEvmEncode('address', recipient2.toString(), '0x2002')
    setEvmEncode('address', recipient3.toString(), '0x2003')
  })

  it('creates the intent properly', () => {
    const intent = buildSwapAndSplit(chainId, amountIn, minAmountOut, [
      new Allocation(recipient1, 9050),
      new Allocation(recipient2, 125),
      new Allocation(recipient3, 825),
    ]).build()

    expect(intent.operations.length).toBe(5)
    expect(intent.operations[0].opType).toBe(OperationType.Swap)
    expect(intent.operations[1].opType).toBe(OperationType.EvmDynamicCall)
    expect(intent.operations[2].opType).toBe(OperationType.EvmDynamicCall)
    expect(intent.operations[3].opType).toBe(OperationType.EvmDynamicCall)
    expect(intent.operations[4].opType).toBe(OperationType.EvmDynamicCall)

    const swap = changetype<Swap>(intent.operations[0])
    expect(swap.sourceChain).toBe(chainId)
    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensIn[0].token).toBe(tokenIn.address.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.amount.toString())
    expect(swap.tokensOut[0].token).toBe(tokenOut.address.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.amount.toString())
    expect(swap.user).toBe(user.toString())

    const pctCall = changetype<EvmDynamicCall>(intent.operations[1])
    expect(pctCall.calls.length).toBe(2)

    expect(pctCall.calls[0].selector).toBe('0xe7032021')
    expect(pctCall.calls[0].arguments[0].data).toBe('0x1000')
    expect(pctCall.calls[0].arguments[1].data).toBe('0x9050')

    expect(pctCall.calls[1].selector).toBe('0xe7032021')
    expect(pctCall.calls[1].arguments[0].data).toBe('0x1000')
    expect(pctCall.calls[1].arguments[1].data).toBe('0x0125')

    const transferCall = changetype<EvmDynamicCall>(intent.operations[2])
    expect(transferCall.calls.length).toBe(2)

    expect(transferCall.calls[0].selector).toBe('0xa9059cbb')
    expect(transferCall.calls[0].arguments[0].data).toBe('0x2001')
    expect(transferCall.calls[0].arguments[1].data).toBe('0x1001')

    expect(transferCall.calls[1].selector).toBe('0xa9059cbb')
    expect(transferCall.calls[1].arguments[0].data).toBe('0x2002')
    expect(transferCall.calls[1].arguments[1].data).toBe('0x1001')

    const balanceOfCall = changetype<EvmDynamicCall>(intent.operations[3])
    expect(balanceOfCall.calls.length).toBe(1)

    expect(balanceOfCall.calls[0].selector).toBe('0x70a08231')
    expect(balanceOfCall.calls[0].arguments[0].data).toBe('0x2000')

    const finalTransferCall = changetype<EvmDynamicCall>(intent.operations[4])
    expect(finalTransferCall.calls.length).toBe(1)

    expect(finalTransferCall.calls[0].selector).toBe('0xa9059cbb')
    expect(finalTransferCall.calls[0].arguments[0].data).toBe('0x2003')
    expect(finalTransferCall.calls[0].arguments[1].data).toBe('0x1003')
  })

  it('throws when there is less than two allocations', () => {
    expect(() => {
      buildSwapAndSplit(chainId, amountIn, minAmountOut, [])
    }).toThrow('More than 1 allocation is needed')

    expect(() => {
      buildSwapAndSplit(chainId, amountIn, minAmountOut, [new Allocation(recipient1, 10_000)])
    }).toThrow('More than 1 allocation is needed')
  })

  it('throws when allocations do not add up to 100%', () => {
    expect(() => {
      const allocations = [new Allocation(recipient1, 9999), new Allocation(recipient2, 0)]

      buildSwapAndSplit(chainId, amountIn, minAmountOut, allocations)
    }).toThrow('Total allocation percentage must be 10_000 bps')

    expect(() => {
      const allocations = [new Allocation(recipient1, 9999), new Allocation(recipient2, 2)]

      buildSwapAndSplit(chainId, amountIn, minAmountOut, allocations)
    }).toThrow('Total allocation percentage must be 10_000 bps')
  })

  it('throws when output token is native', () => {
    expect(() => {
      const nativeAmountOut = TokenAmount.fromStringDecimal(ERC20Token.native(chainId), '100')
      const allocations = [new Allocation(recipient1, 50), new Allocation(recipient2, 9950)]

      buildSwapAndSplit(chainId, amountIn, nativeAmountOut, allocations)
    }).toThrow('Output token cannot be native')
  })
})
