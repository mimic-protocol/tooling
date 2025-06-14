import { SETTLER } from '../../src/helpers'
import { CallBuilder } from '../../src/intents'
import { Token, TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { setContext } from '../helpers'

describe('IntentBuilder', () => {
  const targetAddressStr = '0x0000000000000000000000000000000000000001'
  const userAddressStr = '0x0000000000000000000000000000000000000002'
  const settlerAddressStr = '0x0000000000000000000000000000000000000003'
  const chainId = 1

  it('sets settler, deadline, user, and nonce via builder methods', () => {
    const target = Address.fromString(targetAddressStr)
    const user = Address.fromString(userAddressStr)
    const settler = Address.fromString(settlerAddressStr)
    const feeTokenAddress = Address.fromString('0x00000000000000000000000000000000000000fe')

    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('5'))
    const deadline = BigInt.fromString('123456789')
    const customNonce = '0xabcdef123456'

    const builder = new CallBuilder(feeTokenAmount, chainId)
      .addCall(target, Bytes.fromHexString('0x1234'), BigInt.fromString('1'))
      .addUser(user)
      .addSettler(settler)
      .addDeadline(deadline)
      .addNonce(customNonce)

    const call = builder.build()

    expect(call.user).toBe(user.toString())
    expect(call.settler).toBe(settler.toString())
    expect(call.deadline).toBe('123456789')
    expect(call.nonce).toBe(customNonce)
  })

  it('uses default user, deadline, nonce and settler if not explicitly set', () => {
    const target = Address.fromString(targetAddressStr)
    const feeTokenAddress = Address.fromString('0x00000000000000000000000000000000000000fe')

    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('5'))

    setContext(0, userAddressStr, 'config-transfer')

    const builder = new CallBuilder(feeTokenAmount, chainId)
    builder.addCall(target)

    const call = builder.build()

    expect(call.user).toBe(userAddressStr)
    expect(call.deadline).toBe('300000')
    expect(call.nonce).toBe('0x')
    expect(call.settler).toBe(SETTLER)
  })
})
