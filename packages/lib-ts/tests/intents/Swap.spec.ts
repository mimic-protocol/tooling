import { JSON } from 'json-as'

import { OperationType, Swap, TokenIn, TokenOut } from '../../src/intents'
import { Token } from '../../src/tokens'
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
    const swapIntent = new Swap(sourceChain, tokensIn, tokensOut, destinationChain, settlerAddress, deadline)

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
