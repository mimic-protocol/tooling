import { JSON } from 'json-as'

import { EvmCall, EvmCallBuilder, EvmCallData, OperationEvent, OperationType } from '../../src/intents'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomBytes, randomEvmAddress, randomSettler, setContext } from '../helpers'

describe('EvmCall', () => {
  it('creates a simple operation with default values and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const target = randomEvmAddress()
    const calldata = randomBytes(32)
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'trigger-123')

    const call = new EvmCall(chainId, [new EvmCallData(target, calldata)])
    expect(call.opType).toBe(OperationType.EvmCall)
    expect(call.user).toBe(user.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.events.length).toBe(0)
    expect(call.calls.length).toBe(1)
    expect(call.calls[0].target).toBe(target.toString())
    expect(call.calls[0].data).toBe(calldata.toHexString())
    expect(call.calls[0].value).toBe('0')

    expect(JSON.stringify(call)).toBe(
      `{"opType":2,"chainId":${chainId},"user":"${user}","events":[],"calls":[{"target":"${target}","data":"${calldata.toHexString()}","value":"0"}]}`
    )
  })

  it('creates an operation with explicit user and events', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const target = randomEvmAddress()
    const calldata = randomBytes(32)
    const value = BigInt.fromI32(10)

    setContext(1, 1, user.toString(), [settler], 'trigger-123')

    const call = new EvmCall(chainId, [new EvmCallData(target, calldata, value)], user, [
      new OperationEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data')),
    ])
    expect(call.opType).toBe(OperationType.EvmCall)
    expect(call.user).toBe(user.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.calls[0].value).toBe(value.toString())
    expect(call.events.length).toBe(1)
    expect(call.events[0].topic).toBe('0x746f706963')
    expect(call.events[0].data).toBe('0x64617461')
    expect(JSON.stringify(call)).toBe(
      `{"opType":2,"chainId":${chainId},"user":"${user}","events":[{"topic":"0x746f706963","data":"0x64617461"}],"calls":[{"target":"${target}","data":"${calldata.toHexString()}","value":"${value.toString()}"}]}`
    )
  })

  it('creates a complex operation with multiple calls', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const callData1 = new EvmCallData(randomEvmAddress(), randomBytes(32), BigInt.fromI32(1))
    const callData2 = new EvmCallData(randomEvmAddress(), randomBytes(32), BigInt.fromI32(2))

    setContext(1, 1, user.toString(), [settler], 'trigger-123')

    const call = new EvmCall(chainId, [callData1, callData2], user)
    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(callData1.target)
    expect(call.calls[1].target).toBe(callData2.target)
    expect(JSON.stringify(call)).toBe(
      `{"opType":2,"chainId":${chainId},"user":"${user}","events":[],"calls":[{"target":"${callData1.target}","data":"${callData1.data}","value":"${callData1.value}"},{"target":"${callData2.target}","data":"${callData2.data}","value":"${callData2.value}"}]}`
    )
  })

  it('throws an error when there is not Call Data', () => {
    expect(() => {
      new EvmCall(1, [])
    }).toThrow('Call list cannot be empty')
  })
})

describe('EvmCallBuilder', () => {
  const chainId = 1
  const target1Str = '0x0000000000000000000000000000000000000001'
  const target2Str = '0x0000000000000000000000000000000000000002'

  it('adds multiple calls and builds an operation', () => {
    const target1 = Address.fromString(target1Str)
    const target2 = Address.fromString(target2Str)

    const builder = EvmCallBuilder.forChain(chainId)
    builder.addCall(target1, randomBytes(2), BigInt.fromString('1'))
    builder.addCall(target2, randomBytes(2), BigInt.fromString('2'))

    const call = builder.build()
    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(target1Str)
    expect(call.calls[1].target).toBe(target2Str)
  })

  it('adds call with default data and value', () => {
    const target = Address.fromString(target1Str)

    const builder = EvmCallBuilder.forChain(chainId)
    builder.addCall(target)

    const call = builder.build()
    expect(call.calls[0].data).toBe(Bytes.empty().toHexString())
    expect(call.calls[0].value).toBe('0')
  })
})
