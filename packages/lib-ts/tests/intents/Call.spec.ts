import { JSON } from 'json-as'

import { Call, CallBuilder, CallData, OperationType } from '../../src/intents'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomAddress, randomBytes, randomToken, setContext } from '../helpers'

describe('Call', () => {
  it('creates a simple Call with default values and stringifies it', () => {
    const chainId = 1
    const user = randomAddress()
    const target = randomAddress()
    const calldata = randomBytes(32)
    const fee = TokenAmount.fromI32(randomToken(chainId), 100)
    const settler = randomAddress()

    setContext(1, user.toString(), settler.toString(), 'config-123')

    const call = Call.create(chainId, target, calldata, fee)
    expect(call.op).toBe(OperationType.Call)
    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.deadline).toBe('300001')
    expect(call.nonce).toBe('0x')

    expect(call.calls.length).toBe(1)
    expect(call.calls[0].target).toBe(target.toString())
    expect(call.calls[0].data).toBe(calldata.toHexString())
    expect(call.calls[0].value).toBe('0')

    expect(call.feeToken).toBe(fee.token.address.toString())
    expect(call.feeAmount).toBe(fee.amount.toString())

    expect(JSON.stringify(call)).toBe(
      `{"op":2,"settler":"${settler}","user":"${user}","deadline":"300001","nonce":"0x","chainId":${chainId},"calls":[{"target":"${target}","data":"${calldata.toHexString()}","value":"0"}],"feeToken":"${fee.token.address}","feeAmount":"${fee.amount}"}`
    )
  })

  it('creates a simple Call with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomAddress()
    const settler = randomAddress()
    const deadline = BigInt.fromI32(9999999)
    const target = randomAddress()
    const calldata = randomBytes(32)
    const value = BigInt.fromI32(10)
    const fee = TokenAmount.fromI32(randomToken(chainId), 100)

    setContext(1, user.toString(), settler.toString(), 'config-123')

    const call = Call.create(chainId, target, calldata, fee, value, settler, user, deadline)
    expect(call.op).toBe(OperationType.Call)
    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.deadline).toBe(deadline.toString())
    expect(call.nonce).toBe('0x')

    expect(call.calls.length).toBe(1)
    expect(call.calls[0].target).toBe(target.toString())
    expect(call.calls[0].data).toBe(calldata.toHexString())
    expect(call.calls[0].value).toBe(value.toString())

    expect(call.feeToken).toBe(fee.token.address.toString())
    expect(call.feeAmount).toBe(fee.amount.toString())

    expect(JSON.stringify(call)).toBe(
      `{"op":2,"settler":"${settler}","user":"${user}","deadline":"${deadline}","nonce":"0x","chainId":${chainId},"calls":[{"target":"${target}","data":"${calldata.toHexString()}","value":"${value}"}],"feeToken":"${fee.token.address}","feeAmount":"${fee.amount}"}`
    )
  })

  it('creates a complex Call with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomAddress()
    const settler = randomAddress()
    const deadline = BigInt.fromI32(9999999)
    const fee = TokenAmount.fromI32(randomToken(chainId), 100)
    const callData1 = new CallData(randomAddress(), randomBytes(32), BigInt.fromI32(1))
    const callData2 = new CallData(randomAddress(), randomBytes(32), BigInt.fromI32(2))

    const call = new Call(chainId, [callData1, callData2], fee, settler, user, deadline)
    expect(call.op).toBe(OperationType.Call)
    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.deadline).toBe(deadline.toString())
    expect(call.nonce).toBe('0x')

    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(callData1.target)
    expect(call.calls[0].data).toBe(callData1.data)
    expect(call.calls[0].value).toBe(callData1.value)

    expect(call.calls[1].target).toBe(callData2.target)
    expect(call.calls[1].data).toBe(callData2.data)
    expect(call.calls[1].value).toBe(callData2.value)

    expect(call.feeToken).toBe(fee.token.address.toString())
    expect(call.feeAmount).toBe(fee.amount.toString())
    expect(JSON.stringify(call)).toBe(
      `{"op":2,"settler":"${settler}","user":"${user}","deadline":"${deadline}","nonce":"0x","chainId":${chainId},"calls":[{"target":"${callData1.target}","data":"${callData1.data}","value":"${callData1.value}"},{"target":"${callData2.target}","data":"${callData2.data}","value":"${callData2.value}"}],"feeToken":"${fee.token.address.toString()}","feeAmount":"${fee.amount.toString()}"}`
    )
  })

  it('throws an error when there is not Call Data', () => {
    expect(() => {
      const fee = TokenAmount.fromI32(randomToken(), 10)
      new Call(1, [], fee)
    }).toThrow('Call list cannot be empty')
  })
})

describe('CallBuilder', () => {
  const chainId = 1
  const target1Str = '0x0000000000000000000000000000000000000001'
  const target2Str = '0x0000000000000000000000000000000000000002'

  it('adds multiple calls and builds call', () => {
    const target1 = Address.fromString(target1Str)
    const target2 = Address.fromString(target2Str)
    const fee = TokenAmount.fromI32(randomToken(chainId), 9)

    const builder = CallBuilder.forChainWithFee(chainId, fee)
    builder.addCall(target1, randomBytes(2), BigInt.fromString('1'))
    builder.addCall(target2, randomBytes(2), BigInt.fromString('2'))

    const call = builder.build()
    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(target1Str)
    expect(call.calls[1].target).toBe(target2Str)
  })

  it('adds call with default data and value', () => {
    const target = Address.fromString(target1Str)
    const fee = TokenAmount.fromI32(randomToken(chainId), 9)

    const builder = CallBuilder.forChainWithFee(chainId, fee)
    builder.addCall(target) // default Bytes.empty and BigInt.zero

    const call = builder.build()
    expect(call.calls[0].data).toBe(Bytes.empty().toHexString())
    expect(call.calls[0].value).toBe('0')
  })

  it('throws if fee token chainId mismatches constructor chainId', () => {
    expect(() => {
      const fee = TokenAmount.fromI32(randomToken(2), 9)
      CallBuilder.forChainWithFee(chainId, fee)
    }).toThrow('Fee token must be on the same chain as the one requested for the call')
  })
})
