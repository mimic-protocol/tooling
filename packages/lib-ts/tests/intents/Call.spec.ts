import { JSON } from 'json-as'

import { Call, CallBuilder, CallData, OperationType } from '../../src/intents'
import { Token, TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { setContext } from '../helpers'

describe('Call', () => {
  it('creates a Call intent with valid parameters and stringifies it', () => {
    const callData1Address = Address.fromString('0x0000000000000000000000000000000000000001')
    const callData2Address = Address.fromString('0x0000000000000000000000000000000000000002')
    const intentUserAddress = Address.fromString('0x0000000000000000000000000000000000000003')
    const feeTokenAddress = Address.fromString('0x0000000000000000000000000000000000000004')

    setContext(1, intentUserAddress.toString(), 'config-123')

    const callData1 = new CallData(callData1Address, Bytes.fromHexString('0x01'), BigInt.fromString('1'))
    const callData2 = new CallData(callData2Address, Bytes.fromHexString('0x02'), BigInt.fromString('2'))
    const callIntent = new Call([callData1, callData2], feeTokenAddress, BigInt.fromString('3'), 1)

    expect(callIntent.calls.length).toBe(2)
    expect(callIntent.calls[0].target).toBe(callData1Address.toString())
    expect(callIntent.calls[0].data).toBe('0x01')
    expect(callIntent.calls[0].value).toBe('1')

    expect(callIntent.calls[1].target).toBe(callData2Address.toString())
    expect(callIntent.calls[1].data).toBe('0x02')
    expect(callIntent.calls[1].value).toBe('2')

    expect(callIntent.feeToken).toBe(feeTokenAddress.toString())
    expect(callIntent.feeAmount).toBe('3')
    expect(callIntent.chainId).toBe(1)
    expect(callIntent.op).toBe(OperationType.Call)
    expect(JSON.stringify(callIntent)).toBe(
      '{"op":2,"settler":"0x0000000000000000000000000000000000000000","deadline":"300001","user":"0x0000000000000000000000000000000000000003","nonce":"0x","calls":[{"target":"0x0000000000000000000000000000000000000001","data":"0x01","value":"1"},{"target":"0x0000000000000000000000000000000000000002","data":"0x02","value":"2"}],"feeToken":"0x0000000000000000000000000000000000000004","feeAmount":"3","chainId":1}'
    )
  })

  it('throws an error when there is not Call Data', () => {
    expect(() => {
      new Call([], Address.fromString('0x0000000000000000000000000000000000000004'), BigInt.fromString('3'), 1)
    }).toThrow('Call list cannot be empty')
  })
})

describe('CallBuilder', () => {
  const chainId = 1
  const target1Str = '0x0000000000000000000000000000000000000001'
  const target2Str = '0x0000000000000000000000000000000000000002'
  const feeTokenAddressStr = '0x00000000000000000000000000000000000000fe'

  it('adds multiple calls and builds intent', () => {
    const target1 = Address.fromString(target1Str)
    const target2 = Address.fromString(target2Str)
    const feeTokenAddress = Address.fromString(feeTokenAddressStr)

    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('9'))

    const builder = new CallBuilder(feeTokenAmount, chainId)
    builder.addCall(target1, Bytes.fromHexString('0x01'), BigInt.fromString('1'))
    builder.addCall(target2, Bytes.fromHexString('0x02'), BigInt.fromString('2'))

    const intent = builder.build()
    expect(intent.calls.length).toBe(2)
    expect(intent.calls[0].target).toBe(target1Str)
    expect(intent.calls[1].target).toBe(target2Str)
  })

  it('adds call with default data and value', () => {
    const target = Address.fromString(target1Str)
    const feeTokenAddress = Address.fromString(feeTokenAddressStr)

    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('5'))

    const builder = new CallBuilder(feeTokenAmount, chainId)
    builder.addCall(target) // default Bytes.empty and BigInt.zero

    const intent = builder.build()
    expect(intent.calls[0].data).toBe(Bytes.empty().toHexString())
    expect(intent.calls[0].value).toBe('0')
  })

  it('throws if fee token chainId mismatches constructor chainId', () => {
    expect(() => {
      const feeTokenAddress = Address.fromString(feeTokenAddressStr)
      const feeToken = new Token(feeTokenAddress.toString(), 2)
      const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('1'))

      new CallBuilder(feeTokenAmount, chainId)
    }).toThrow('Fee token must be on the same chain as the intent')
  })

  it('throws if fee token chainId mismatches in addFeeTokenAmount', () => {
    expect(() => {
      const feeTokenAddress = Address.fromString(feeTokenAddressStr)
      const correctFeeToken = new Token(feeTokenAddress.toString(), chainId)
      const feeTokenAmount = new TokenAmount(correctFeeToken, BigInt.fromString('1'))

      const builder = new CallBuilder(feeTokenAmount, chainId)

      const wrongChainToken = new Token(feeTokenAddress.toString(), 1337)
      const wrongFeeTokenAmount = new TokenAmount(wrongChainToken, BigInt.fromString('1'))

      builder.addFeeTokenAmount(wrongFeeTokenAmount)
    }).toThrow('Fee token must be on the same chain as the intent')
  })
})
