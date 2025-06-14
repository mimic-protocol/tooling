import { JSON } from 'json-as'

import { OperationType, Swap, SwapBuilder, TokenIn, TokenOut } from '../../src/intents'
import { Token, TokenAmount } from '../../src/tokens'
import { Address, BigInt } from '../../src/types'
import { setContext } from '../helpers'

describe('Swap Intent', () => {
  it('creates a Swap intent with valid parameters and stringifies it', () => {
    const tokenInAddress = Address.fromString('0x0000000000000000000000000000000000000001')
    const tokenOutAddress = Address.fromString('0x0000000000000000000000000000000000000002')
    const recipientAddress = Address.fromString('0x0000000000000000000000000000000000000003')
    const settlerAddress = Address.fromString('0x0000000000000000000000000000000000000004')

    const sourceChain = 1
    const destinationChain = 10
    const deadline = BigInt.fromString('123456789')

    setContext(sourceChain, recipientAddress.toString(), 'config-456')

    const tokenIn = new Token(tokenInAddress.toString(), 18)
    const tokenOut = new Token(tokenOutAddress.toString(), 18)
    const tokensIn = [TokenIn.fromStringDecimal(tokenIn, '1')]
    const tokensOut = [TokenOut.fromStringDecimal(tokenOut, '1', recipientAddress)]
    const swapIntent = new Swap(sourceChain, tokensIn, tokensOut, destinationChain, null, settlerAddress, deadline)

    expect(swapIntent.sourceChain).toBe(sourceChain)
    expect(swapIntent.destinationChain).toBe(destinationChain)
    expect(swapIntent.op).toBe(OperationType.Swap)
    expect(swapIntent.tokensIn.length).toBe(1)
    expect(swapIntent.tokensOut.length).toBe(1)
    expect(swapIntent.tokensIn[0].token).toBe(tokenInAddress.toString())
    expect(swapIntent.tokensOut[0].token).toBe(tokenOutAddress.toString())
    expect(swapIntent.tokensOut[0].recipient).toBe(recipientAddress.toString())
    expect(JSON.stringify(swapIntent)).toBe(
      '{"op":0,"settler":"0x0000000000000000000000000000000000000004","deadline":"123456789","user":"0x0000000000000000000000000000000000000003","nonce":"0x","sourceChain":1,"tokensIn":[{"token":"0x0000000000000000000000000000000000000001","amount":"1"}],"tokensOut":[{"token":"0x0000000000000000000000000000000000000002","minAmount":"1","recipient":"0x0000000000000000000000000000000000000003"}],"destinationChain":10}'
    )
  })

  it('throws an error when TokenIn list is empty', () => {
    expect(() => {
      const tokenOutAddress = Address.fromString('0x0000000000000000000000000000000000000002')
      const recipientAddress = Address.fromString('0x0000000000000000000000000000000000000003')
      const tokenOut = new Token(tokenOutAddress.toString(), 18)
      const tokensOut = [TokenOut.fromStringDecimal(tokenOut, '0.5', recipientAddress)]
      new Swap(1, [], tokensOut, 10, null, null)
    }).toThrow('TokenIn list cannot be empty')
  })

  it('throws an error when TokenOut list is empty', () => {
    expect(() => {
      const tokenInAddress = Address.fromString('0x0000000000000000000000000000000000000001')
      const tokenIn = new Token(tokenInAddress.toString(), 18)
      const tokensIn: TokenIn[] = [TokenIn.fromStringDecimal(tokenIn, '1.0')]
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

  it('builds a Swap intent with token amounts', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = new Token(tokenInAddress.toString(), sourceChain)
    const tokenOut = new Token(tokenOutAddress.toString(), destinationChain)

    const tokenInAmount = new TokenAmount(tokenIn, BigInt.fromString('1000'))
    const tokenOutAmount = new TokenAmount(tokenOut, BigInt.fromString('950'))

    const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
    builder.addTokenInFromTokenAmount(tokenInAmount)
    builder.addTokenOutFromTokenAmount(tokenOutAmount, recipientAddress)

    const intent = builder.build()

    expect(intent.op).toBe(OperationType.Swap)
    expect(intent.sourceChain).toBe(sourceChain)
    expect(intent.destinationChain).toBe(destinationChain)
    expect(intent.tokensIn[0].token).toBe(tokenInAddress.toString())
    expect(intent.tokensOut[0].recipient).toBe(recipientAddress.toString())
  })

  it('adds multiple TokenIn/Out with fromStringDecimal', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = new Token(tokenInAddress.toString(), sourceChain)
    const tokenOut = new Token(tokenOutAddress.toString(), destinationChain)

    const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
    builder.addTokenInFromStringDecimal(tokenIn, '1')
    builder.addTokenOutFromStringDecimal(tokenOut, '1', recipientAddress)

    const intent = builder.build()

    expect(intent.tokensIn.length).toBe(1)
    expect(intent.tokensOut.length).toBe(1)
    expect(intent.tokensIn[0].amount).toBe('1')
    expect(intent.tokensOut[0].minAmount).toBe('1')
  })

  it('throws if TokenIn chainId does not match sourceChain', () => {
    expect(() => {
      const token = new Token(tokenInAddressStr, 999) // wrong chain
      const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
      builder.addTokenInFromStringDecimal(token, '1')
    }).toThrow('All tokens in must be on the same chain')
  })

  it('throws if TokenOut chainId does not match destinationChain', () => {
    expect(() => {
      const recipient = Address.fromString(recipientAddressStr)
      const token = new Token(tokenOutAddressStr, 5) // wrong chain
      const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
      builder.addTokenOutFromStringDecimal(token, '1', recipient)
    }).toThrow('All tokens out must be on the same chain')
  })

  it('adds tokensIn and tokensOut via arrays', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = new Token(tokenInAddress.toString(), sourceChain)
    const tokenOut = new Token(tokenOutAddress.toString(), destinationChain)

    const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')
    const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '2')

    const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
    builder.addTokensInFromTokenAmounts([tokenInAmount])
    builder.addTokensOutFromTokenAmounts([tokenOutAmount], recipientAddress)

    const intent = builder.build()

    expect(intent.tokensIn.length).toBe(1)
    expect(intent.tokensOut.length).toBe(1)
  })

  it('throws if no TokenIn is added before build', () => {
    expect(() => {
      const tokenOut = new Token(tokenOutAddressStr, destinationChain)
      const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '1')
      const recipient = Address.fromString(recipientAddressStr)

      const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
      builder.addTokenOutFromTokenAmount(tokenOutAmount, recipient)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })

  it('throws if no TokenOut is added before build', () => {
    expect(() => {
      const tokenIn = new Token(tokenInAddressStr, sourceChain)
      const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')

      const builder = SwapBuilder.fromChains(sourceChain, destinationChain)
      builder.addTokenInFromTokenAmount(tokenInAmount)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })
})
