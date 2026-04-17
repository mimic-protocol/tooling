import { JSON } from 'json-as'

import {
  EvmDynamicArg,
  EvmDynamicArgKind,
  EvmDynamicCall,
  EvmDynamicCallBuilder,
  EvmDynamicCallData,
  OperationEvent,
  OperationType,
} from '../../src/intents'
import { Address, BigInt, Bytes, EvmEncodeParam } from '../../src/types'
import { randomBytes, randomEvmAddress, randomSettler, setContext, setEvmEncode } from '../helpers'

describe('EvmDynamicCall', () => {
  it('creates a simple operation with default values and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const target = randomEvmAddress()
    const selector = Bytes.fromHexString('0x12345678')
    const argument = new EvmDynamicArg(EvmDynamicArgKind.Literal, randomBytes(64))
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'trigger-123')

    const call = new EvmDynamicCall(chainId, [new EvmDynamicCallData(target, selector, [argument])])
    expect(call.opType).toBe(OperationType.EvmDynamicCall)
    expect(call.user).toBe(user.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.events.length).toBe(0)
    expect(call.calls.length).toBe(1)
    expect(call.calls[0].target).toBe(target.toString())
    expect(call.calls[0].value).toBe('0')
    expect(call.calls[0].selector).toBe(selector.toHexString())
    expect(call.calls[0].arguments.length).toBe(1)
    expect(call.calls[0].arguments[0].kind).toBe(EvmDynamicArgKind.Literal)
    expect(call.calls[0].arguments[0].data).toBe(argument.data)

    expect(JSON.stringify(call)).toBe(
      `{"opType":4,"chainId":${chainId},"user":"${user}","events":[],"calls":[{"target":"${target}","value":"0","selector":"${selector.toHexString()}","arguments":[{"kind":0,"data":"${argument.data}"}]}]}`
    )
  })

  it('creates an operation with explicit user and events', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const target = randomEvmAddress()
    const selector = Bytes.fromHexString('0x90abcdef')
    const argument = new EvmDynamicArg(EvmDynamicArgKind.Variable, randomBytes(64))
    const value = BigInt.fromI32(10)

    setContext(1, 1, user.toString(), [settler], 'trigger-123')

    const call = new EvmDynamicCall(chainId, [new EvmDynamicCallData(target, selector, [argument], value)], user, [
      new OperationEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data')),
    ])

    expect(call.opType).toBe(OperationType.EvmDynamicCall)
    expect(call.user).toBe(user.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.calls[0].value).toBe(value.toString())
    expect(call.events.length).toBe(1)
    expect(call.events[0].topic).toBe('0x746f706963')
    expect(call.events[0].data).toBe('0x64617461')
    expect(JSON.stringify(call)).toBe(
      `{"opType":4,"chainId":${chainId},"user":"${user}","events":[{"topic":"0x746f706963","data":"0x64617461"}],"calls":[{"target":"${target}","value":"${value.toString()}","selector":"${selector.toHexString()}","arguments":[{"kind":1,"data":"${argument.data}"}]}]}`
    )
  })

  it('creates a complex operation with multiple calls', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const target1 = randomEvmAddress()
    const target2 = randomEvmAddress()
    const selector1 = Bytes.fromHexString('0x12345678')
    const selector2 = Bytes.fromHexString('0x90abcdef')
    const argument1 = new EvmDynamicArg(EvmDynamicArgKind.Literal, randomBytes(64))
    const argument2 = new EvmDynamicArg(EvmDynamicArgKind.Variable, randomBytes(64))

    setContext(1, 1, user.toString(), [settler], 'trigger-123')

    const call = new EvmDynamicCall(
      chainId,
      [
        new EvmDynamicCallData(target1, selector1, [argument1], BigInt.fromI32(1)),
        new EvmDynamicCallData(target2, selector2, [argument2], BigInt.fromI32(2)),
      ],
      user
    )

    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(target1.toString())
    expect(call.calls[0].selector).toBe(selector1.toHexString())
    expect(call.calls[0].arguments.length).toBe(1)
    expect(call.calls[0].arguments[0].kind).toBe(EvmDynamicArgKind.Literal)
    expect(call.calls[0].arguments[0].data).toBe(argument1.data)
    expect(call.calls[0].value).toBe('1')

    expect(call.calls[1].target).toBe(target2.toString())
    expect(call.calls[1].selector).toBe(selector2.toHexString())
    expect(call.calls[1].arguments.length).toBe(1)
    expect(call.calls[1].arguments[0].kind).toBe(EvmDynamicArgKind.Variable)
    expect(call.calls[1].arguments[0].data).toBe(argument2.data)
    expect(call.calls[1].value).toBe('2')

    expect(JSON.stringify(call)).toBe(
      `{"opType":4,"chainId":${chainId},"user":"${user}","events":[],"calls":[{"target":"${target1}","value":"1","selector":"${selector1.toHexString()}","arguments":[{"kind":0,"data":"${argument1.data}"}]},{"target":"${target2}","value":"2","selector":"${selector2.toHexString()}","arguments":[{"kind":1,"data":"${argument2.data}"}]}]}`
    )
  })

  it('throws an error when there is no call data', () => {
    expect(() => {
      new EvmDynamicCall(1, [])
    }).toThrow('Call list cannot be empty')
  })

  it('throws an error when the selector is not 4 bytes', () => {
    expect(() => {
      new EvmDynamicCallData(randomEvmAddress(), Bytes.fromHexString('0x1234'))
    }).toThrow('Selector must be 4 bytes')
  })
})

describe('EvmDynamicArg', () => {
  it('encodes literal arguments', () => {
    const emptyString = Bytes.fromUTF8('').toHexString()
    setEvmEncode('string', emptyString, '0x1234')

    const argument = EvmDynamicArg.literal([EvmEncodeParam.fromValue('uint256', BigInt.fromI32(1))])

    expect(argument.kind).toBe(EvmDynamicArgKind.Literal)
    expect(argument.data).toBe('0x1234')
  })

  it('encodes variable references', () => {
    setEvmEncode('uint256', '1', '0x5678')

    const argument = EvmDynamicArg.variable(1, 0)

    expect(argument.kind).toBe(EvmDynamicArgKind.Variable)
    expect(argument.data).toBe('0x5678')
  })
})

describe('EvmDynamicCallBuilder', () => {
  const chainId = 1
  const target1Str = '0x0000000000000000000000000000000000000001'
  const target2Str = '0x0000000000000000000000000000000000000002'

  it('adds multiple calls and builds an operation', () => {
    const target1 = Address.fromString(target1Str)
    const target2 = Address.fromString(target2Str)
    const selector1 = Bytes.fromHexString('0x12345678')
    const selector2 = Bytes.fromHexString('0x90abcdef')

    const builder = EvmDynamicCallBuilder.forChain(chainId)
    builder.addCall(
      target1,
      selector1,
      [new EvmDynamicArg(EvmDynamicArgKind.Literal, randomBytes(64))],
      BigInt.fromString('1')
    )
    builder.addCall(
      target2,
      selector2,
      [new EvmDynamicArg(EvmDynamicArgKind.Variable, randomBytes(64))],
      BigInt.fromString('2')
    )

    const call = builder.build()
    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(target1Str)
    expect(call.calls[0].selector).toBe(selector1.toHexString())
    expect(call.calls[1].target).toBe(target2Str)
    expect(call.calls[1].selector).toBe(selector2.toHexString())
  })

  it('adds call with default arguments and value', () => {
    const target = Address.fromString(target1Str)
    const selector = Bytes.fromHexString('0x12345678')

    const builder = EvmDynamicCallBuilder.forChain(chainId)
    builder.addCall(target, selector)

    const call = builder.build()
    expect(call.calls[0].arguments.length).toBe(0)
    expect(call.calls[0].value).toBe('0')
  })
})
