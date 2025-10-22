import { SerializableSettler } from '../../src/context'
import { NULL_ADDRESS } from '../../src/helpers'
import { EvmCallBuilder } from '../../src/intents'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomERC20Token, randomSettler, setContext } from '../helpers'

describe('IntentBuilder', () => {
  const chainId = 1
  const targetAddressStr = '0x0000000000000000000000000000000000000001'

  describe('when the user is not zero', () => {
    const userAddressStr = '0x0000000000000000000000000000000000000002'

    describe('when the settler is not zero', () => {
      const settlerAddressStr = '0x0000000000000000000000000000000000000003'

      it('sets intent properties via builder methods', () => {
        const target = Address.fromString(targetAddressStr)
        const user = Address.fromString(userAddressStr)
        const settler = Address.fromString(settlerAddressStr)
        const fee = TokenAmount.fromI32(randomERC20Token(chainId), 9)
        const deadline = BigInt.fromString('123456789')
        const customNonce = '0xabcdef123456'

        setContext(0, 1, '0x0000000000000000000000000000000000000000', [], '1')

        const builder = EvmCallBuilder.forChain(chainId)
          .addCall(target, Bytes.fromHexString('0x1234'), BigInt.fromString('1'))
          .addUser(user)
          .addSettler(settler)
          .addDeadline(deadline)
          .addNonce(customNonce)
          .addMaxFee(fee)

        const call = builder.build()
        expect(call.user).toBe(user.toString())
        expect(call.settler).toBe(settler.toString())
        expect(call.deadline).toBe('123456789')
        expect(call.nonce).toBe(customNonce)
        expect(call.maxFees.length).toBe(1)
        expect(call.maxFees[0].token).toBe(fee.token.address.toString())
        expect(call.maxFees[0].amount).toBe(fee.amount.toString())
      })

      it('uses default user, deadline, nonce and settler if not explicitly set', () => {
        const target = Address.fromString(targetAddressStr)
        const settler = randomSettler(chainId)
        const fee = TokenAmount.fromI32(randomERC20Token(chainId), 9)

        setContext(0, 1, userAddressStr, [settler], 'config-transfer')

        const builder = EvmCallBuilder.forChain(chainId).addCall(target).addMaxFee(fee)

        const call = builder.build()
        expect(call.user).toBe(userAddressStr)
        expect(call.settler).toBe(settler.address.toString())
        expect(call.deadline).toBe('300')
        expect(call.nonce).toBe('0x')
        expect(call.maxFees.length).toBe(1)
        expect(call.maxFees[0].token).toBe(fee.token.address.toString())
        expect(call.maxFees[0].amount).toBe(fee.amount.toString())
      })
    })

    describe('when the settler is zero', () => {
      it('throws an error', () => {
        const settler = new SerializableSettler(NULL_ADDRESS, chainId)
        setContext(0, 1, userAddressStr, [settler], 'config-call')

        expect(() => {
          const builder = EvmCallBuilder.forChain(chainId)
          builder.build()
        }).toThrow('A settler contract must be specified')
      })
    })
  })

  describe('when the user is zero', () => {
    const userAddressStr = NULL_ADDRESS

    it('throws an error', () => {
      const settler = randomSettler(chainId)
      setContext(0, 1, userAddressStr, [settler], 'config-call')

      expect(() => {
        const builder = EvmCallBuilder.forChain(chainId)
        builder.build()
      }).toThrow('A user must be specified')
    })
  })
})
