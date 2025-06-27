import { NULL_ADDRESS } from '../../src/helpers'
import { CallBuilder } from '../../src/intents'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomToken, setContext } from '../helpers'

describe('IntentBuilder', () => {
  const targetAddressStr = '0x0000000000000000000000000000000000000001'
  const chainId = 1

  describe('when the user is not zero', () => {
    const userAddressStr = '0x0000000000000000000000000000000000000002'

    describe('when the settler is not zero', () => {
      const settlerAddressStr = '0x0000000000000000000000000000000000000003'

      it('sets settler, deadline, user, and nonce via builder methods', () => {
        const target = Address.fromString(targetAddressStr)
        const user = Address.fromString(userAddressStr)
        const settler = Address.fromString(settlerAddressStr)
        const fee = TokenAmount.fromI32(randomToken(chainId), 9)
        const deadline = BigInt.fromString('123456789')
        const customNonce = '0xabcdef123456'

        const builder = CallBuilder.forChainWithFee(chainId, fee)
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
        const fee = TokenAmount.fromI32(randomToken(chainId), 9)

        setContext(0, userAddressStr, settlerAddressStr, 'config-transfer')

        const builder = CallBuilder.forChainWithFee(chainId, fee)
        builder.addCall(target)

        const call = builder.build()
        expect(call.user).toBe(userAddressStr)
        expect(call.settler).toBe(settlerAddressStr)
        expect(call.deadline).toBe('300')
        expect(call.nonce).toBe('0x')
      })
    })

    describe('when the settler is zero', () => {
      const settlerAddressStr = NULL_ADDRESS

      it('throws an error', () => {
        setContext(0, userAddressStr, settlerAddressStr, 'config-call')

        expect(() => {
          const fee = TokenAmount.fromI32(randomToken(chainId), 9)
          const builder = CallBuilder.forChainWithFee(chainId, fee)
          builder.build()
        }).toThrow('A settler contract must be specified')
      })
    })
  })

  describe('when the user is zero', () => {
    const userAddressStr = NULL_ADDRESS

    it('throws an error', () => {
      setContext(0, userAddressStr, NULL_ADDRESS, 'config-call')

      expect(() => {
        const fee = TokenAmount.fromI32(randomToken(chainId), 9)
        const builder = CallBuilder.forChainWithFee(chainId, fee)
        builder.build()
      }).toThrow('A user must be specified')
    })
  })
})
