import { JSON } from 'json-as'

import { Call, CallBuilder, CallData, OperationType } from '../../src/intents'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomBytes, randomEvmAddress, randomSettler, randomToken, setContext } from '../helpers'

describe('Call', () => {
  it('creates a simple Call with default values and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const target = randomEvmAddress()
    const calldata = randomBytes(32)
    const fee = TokenAmount.fromI32(randomToken(chainId), 100)
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'config-123')

    const call = Call.create(chainId, target, calldata, fee)
    expect(call.op).toBe(OperationType.Call)
    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.address.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.deadline).toBe('300')
    expect(call.nonce).toBe('0x')

    expect(call.calls.length).toBe(1)
    expect(call.calls[0].target).toBe(target.toString())
    expect(call.calls[0].data).toBe(calldata.toHexString())
    expect(call.calls[0].value).toBe('0')

    expect(call.maxFees.length).toBe(1)
    expect(call.maxFees[0].token).toBe(fee.token.address.toString())
    expect(call.maxFees[0].amount).toBe(fee.amount.toString())

    expect(JSON.stringify(call)).toBe(
      `{"op":2,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"chainId":${chainId},"calls":[{"target":"${target}","data":"${calldata.toHexString()}","value":"0"}]}`
    )
  })

  it('creates a simple Call with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(9999999)
    const target = randomEvmAddress()
    const calldata = randomBytes(32)
    const value = BigInt.fromI32(10)
    const fee = TokenAmount.fromI32(randomToken(chainId), 100)

    setContext(1, 1, user.toString(), [settler], 'config-123')

    const call = Call.create(chainId, target, calldata, fee, value, Address.fromString(settler.address), user, deadline)
    expect(call.op).toBe(OperationType.Call)
    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.address.toString())
    expect(call.chainId).toBe(chainId)
    expect(call.deadline).toBe(deadline.toString())
    expect(call.nonce).toBe('0x')

    expect(call.calls.length).toBe(1)
    expect(call.calls[0].target).toBe(target.toString())
    expect(call.calls[0].data).toBe(calldata.toHexString())
    expect(call.calls[0].value).toBe(value.toString())

    expect(call.maxFees.length).toBe(1)
    expect(call.maxFees[0].token).toBe(fee.token.address.toString())
    expect(call.maxFees[0].amount).toBe(fee.amount.toString())

    expect(JSON.stringify(call)).toBe(
      `{"op":2,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"chainId":${chainId},"calls":[{"target":"${target}","data":"${calldata.toHexString()}","value":"${value}"}]}`
    )
  })

  it('creates a complex Call with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(9999999)
    const fee = TokenAmount.fromI32(randomToken(chainId), 100)
    const callData1 = new CallData(randomEvmAddress(), randomBytes(32), BigInt.fromI32(1))
    const callData2 = new CallData(randomEvmAddress(), randomBytes(32), BigInt.fromI32(2))
    const callDatas = [callData1, callData2]

    const call = new Call(chainId, callDatas, [fee], Address.fromString(settler.address), user, deadline, '0x')
    expect(call.op).toBe(OperationType.Call)
    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.address.toString())
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

    expect(call.maxFees.length).toBe(1)
    expect(call.maxFees[0].token).toBe(fee.token.address.toString())
    expect(call.maxFees[0].amount).toBe(fee.amount.toString())

    expect(JSON.stringify(call)).toBe(
      `{"op":2,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"chainId":${chainId},"calls":[{"target":"${callData1.target}","data":"${callData1.data}","value":"${callData1.value}"},{"target":"${callData2.target}","data":"${callData2.data}","value":"${callData2.value}"}]}`
    )
  })

  it('throws an error when there is not Call Data', () => {
    expect(() => {
      new Call(1, [], [])
    }).toThrow('Call list cannot be empty')
  })

  it('throws an error when there is no max fee', () => {
    expect(() => {
      const callData = new CallData(randomEvmAddress(), randomBytes(32), BigInt.fromI32(1))
      new Call(1, [callData], [])
    }).toThrow('At least a max fee must be specified')
  })
})

describe('CallBuilder', () => {
  const chainId = 1
  const target1Str = '0x0000000000000000000000000000000000000001'
  const target2Str = '0x0000000000000000000000000000000000000002'

  it('adds multiple calls and builds call', () => {
    const target1 = Address.fromString(target1Str)
    const target2 = Address.fromString(target2Str)

    const builder = CallBuilder.forChain(chainId)
    builder.addCall(target1, randomBytes(2), BigInt.fromString('1'))
    builder.addCall(target2, randomBytes(2), BigInt.fromString('2'))
    builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 100))

    const call = builder.build()
    expect(call.calls.length).toBe(2)
    expect(call.calls[0].target).toBe(target1Str)
    expect(call.calls[1].target).toBe(target2Str)
  })

  it('adds call with default data and value', () => {
    const target = Address.fromString(target1Str)

    const builder = CallBuilder.forChain(chainId)
    builder.addCall(target) // default Bytes.empty and BigInt.zero
    builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 100))

    const call = builder.build()
    expect(call.calls[0].data).toBe(Bytes.empty().toHexString())
    expect(call.calls[0].value).toBe('0')
  })

  it('throws if fee token chainId mismatches constructor chainId', () => {
    expect(() => {
      const fee = TokenAmount.fromI32(randomToken(2), 9)
      CallBuilder.forChain(chainId).addMaxFee(fee)
    }).toThrow('Fee token must be on the same chain as the one requested for the call')
  })
})
