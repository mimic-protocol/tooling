import { JSON } from 'json-as'

import { OperationType, Swap, SwapBuilder, TokenIn, TokenOut } from '../../src/intents'
import { Token, TokenAmount } from '../../src/tokens'
import { Address, BigInt } from '../../src/types'
import { randomEvmAddress, randomSettler, randomToken, setContext } from '../helpers'

describe('Swap', () => {
  it('creates a simple Swap with default values', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const tokenIn = randomEvmAddress()
    const amountIn = BigInt.fromI32(10)
    const tokenOut = randomEvmAddress()
    const minAmountOut = BigInt.fromI32(100)
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = Swap.create(chainId, tokenIn, amountIn, tokenOut, minAmountOut)
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe('300')
    expect(swap.nonce).toBe('0x')

    expect(swap.sourceChain).toBe(chainId)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.toString())

    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.toString())
    expect(swap.tokensOut[0].recipient).toBe(user.toString())
    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","sourceChain":${chainId},"tokensIn":[{"token":"${tokenIn}","amount":"${amountIn}"}],"tokensOut":[{"token":"${tokenOut}","minAmount":"${minAmountOut}","recipient":"${user}"}],"destinationChain":${chainId}}`
    )
  })

  it('creates a simple Swap with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(999999)
    const tokenIn = randomEvmAddress()
    const amountIn = BigInt.fromI32(10)
    const tokenOut = randomEvmAddress()
    const minAmountOut = BigInt.fromI32(100)

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = Swap.create(
      chainId,
      tokenIn,
      amountIn,
      tokenOut,
      minAmountOut,
      Address.fromString(settler.address),
      user,
      deadline
    )
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe(deadline.toString())
    expect(swap.nonce).toBe('0x')

    expect(swap.sourceChain).toBe(chainId)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.toString())

    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.toString())
    expect(swap.tokensOut[0].recipient).toBe(user.toString())
    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","sourceChain":${chainId},"tokensIn":[{"token":"${tokenIn}","amount":"${amountIn}"}],"tokensOut":[{"token":"${tokenOut}","minAmount":"${minAmountOut}","recipient":"${user}"}],"destinationChain":${chainId}}`
    )
  })

  it('creates a complex Swap with valid parameters and stringifies it', () => {
    const sourceChain = 1
    const destinationChain = 10
    const user = randomEvmAddress()
    const settler = randomSettler(sourceChain)
    const deadline = BigInt.fromI32(999999)
    const tokenIn = TokenIn.fromI32(randomToken(sourceChain), 10)
    const tokenOut = TokenOut.fromI32(randomToken(destinationChain), 100, randomEvmAddress())

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = new Swap(
      sourceChain,
      [tokenIn],
      [tokenOut],
      destinationChain,
      Address.fromString(settler.address),
      user,
      deadline
    )
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe(deadline.toString())
    expect(swap.nonce).toBe('0x')

    expect(swap.sourceChain).toBe(sourceChain)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.token)
    expect(swap.tokensIn[0].amount).toBe(tokenIn.amount)

    expect(swap.destinationChain).toBe(destinationChain)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.token)
    expect(swap.tokensOut[0].minAmount).toBe(tokenOut.minAmount)
    expect(swap.tokensOut[0].recipient).toBe(tokenOut.recipient)
    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","sourceChain":${sourceChain},"tokensIn":[{"token":"${tokenIn.token}","amount":"${tokenIn.amount}"}],"tokensOut":[{"token":"${tokenOut.token}","minAmount":"${tokenOut.minAmount}","recipient":"${tokenOut.recipient}"}],"destinationChain":${destinationChain}}`
    )
  })

  it('throws an error when TokenIn list is empty', () => {
    expect(() => {
      const tokensOut = [TokenOut.fromI32(randomToken(), 10, randomEvmAddress())]
      new Swap(1, [], tokensOut, 10, null, null)
    }).toThrow('TokenIn list cannot be empty')
  })

  it('throws an error when TokenOut list is empty', () => {
    expect(() => {
      const tokensIn = [TokenIn.fromI32(randomToken(), 10)]
      new Swap(1, tokensIn, [], 10, null, null)
    }).toThrow('TokenOut list cannot be empty')
  })
})

describe('SwapBuilder', () => {
  const sourceChain = 1
  const destinationChain = 10
  const tokenInAddressStr = '0x0000000000000000000000000000000000000001'
  const tokenOutAddressStr = '0x0000000000000000000000000000000000000002'
  const recipientAddressStr = '0x0000000000000000000000000000000000000003'

  it('builds a Swap with token amounts', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = Token.fromAddress(tokenInAddress, sourceChain)
    const tokenOut = Token.fromAddress(tokenOutAddress, destinationChain)

    const tokenInAmount = TokenAmount.fromI32(tokenIn, 1000)
    const tokenOutAmount = TokenAmount.fromI32(tokenOut, 950)

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokenInFromTokenAmount(tokenInAmount)
    builder.addTokenOutFromTokenAmount(tokenOutAmount, recipientAddress)

    const swap = builder.build()
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.sourceChain).toBe(sourceChain)
    expect(swap.destinationChain).toBe(destinationChain)
    expect(swap.tokensIn[0].token).toBe(tokenInAddress.toString())
    expect(swap.tokensOut[0].recipient).toBe(recipientAddress.toString())
  })

  it('adds multiple TokenIn/Out with fromStringDecimal', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = Token.fromAddress(tokenInAddress, sourceChain)
    const tokenOut = Token.fromAddress(tokenOutAddress, destinationChain)

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokenInFromStringDecimal(tokenIn, '1')
    builder.addTokenOutFromStringDecimal(tokenOut, '1', recipientAddress)

    const swap = builder.build()
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensIn[0].amount).toBe('1')
    expect(swap.tokensOut[0].minAmount).toBe('1')
  })

  it('throws if TokenIn chainId does not match sourceChain', () => {
    expect(() => {
      const token = Token.fromString(tokenInAddressStr, 999) // wrong chain
      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenInFromStringDecimal(token, '1')
    }).toThrow('All tokens in must be on the same chain')
  })

  it('throws if TokenOut chainId does not match destinationChain', () => {
    expect(() => {
      const recipient = Address.fromString(recipientAddressStr)
      const token = Token.fromString(tokenOutAddressStr, 5) // wrong chain
      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenOutFromStringDecimal(token, '1', recipient)
    }).toThrow('All tokens out must be on the same chain')
  })

  it('adds tokensIn and tokensOut via arrays', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = Token.fromAddress(tokenInAddress, sourceChain)
    const tokenOut = Token.fromAddress(tokenOutAddress, destinationChain)

    const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')
    const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '2')

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokensInFromTokenAmounts([tokenInAmount])
    builder.addTokensOutFromTokenAmounts([tokenOutAmount], recipientAddress)

    const swap = builder.build()
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensOut.length).toBe(1)
  })

  it('throws if no TokenIn is added before build', () => {
    expect(() => {
      const tokenOut = Token.fromString(tokenOutAddressStr, destinationChain)
      const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '1')
      const recipient = Address.fromString(recipientAddressStr)

      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenOutFromTokenAmount(tokenOutAmount, recipient)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })

  it('throws if no TokenOut is added before build', () => {
    expect(() => {
      const tokenIn = Token.fromString(tokenInAddressStr, sourceChain)
      const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')

      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenInFromTokenAmount(tokenInAmount)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })
})
