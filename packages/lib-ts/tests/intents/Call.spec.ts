import { Call, CallData, OperationType } from '../../src/intents'
import { Address, BigInt, Bytes } from '../../src/types'
import { setContext } from '../helpers'

describe('Call', () => {
  it('creates a Call intent with valid parameters', () => {
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
  })

  it('throws an error when there is not Call Data', () => {
    expect(() => {
      new Call([], Address.fromString('0x0000000000000000000000000000000000000004'), BigInt.fromString('3'), 1)
    }).toThrow('Call list cannot be empty')
  })
})
