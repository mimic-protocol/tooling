import { JSON } from 'json-as'

import { SerializableSettler } from '../../src/context'
import { NULL_ADDRESS } from '../../src/helpers'
import { EvmCallBuilder, IntentBuilder } from '../../src/intents'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomERC20Token, randomSettler, setContext } from '../helpers'

describe('IntentBuilder', () => {
  const chainId = 1
  const targetAddressStr = '0x0000000000000000000000000000000000000001'

  describe('when the fee payer is not zero', () => {
    const userAddressStr = '0x0000000000000000000000000000000000000002'

    describe('when the settler is not zero', () => {
      const settlerAddressStr = '0x0000000000000000000000000000000000000003'

      it('sets intent properties via builder methods', () => {
        const target = Address.fromString(targetAddressStr)
        const settler = Address.fromString(settlerAddressStr)
        const feePayer = Address.fromString(userAddressStr)
        const fee = TokenAmount.fromI32(randomERC20Token(chainId), 9)
        const deadline = BigInt.fromString('123456789')
        const customNonce = '0xabcdef123456'

        setContext(0, 1, '0x0000000000000000000000000000000000000004', [], '1')

        const intent = new IntentBuilder()
          .addOperationBuilder(EvmCallBuilder.forChain(chainId).addCall(target, Bytes.fromHexString('0x1234')))
          .addSettler(settler)
          .addFeePayer(feePayer)
          .addDeadline(deadline)
          .addNonce(customNonce)
          .addMaxFee(fee)
          .build()

        expect(intent.operations.length).toBe(1)
        expect(intent.operations[0].user).toBe('0x0000000000000000000000000000000000000004')
        expect(intent.settler).toBe(settler.toString())
        expect(intent.feePayer).toBe(feePayer.toString())
        expect(intent.deadline).toBe('123456789')
        expect(intent.nonce).toBe(customNonce)
        expect(intent.maxFees.length).toBe(1)
        expect(intent.maxFees[0].token).toBe(fee.token.address.toString())
        expect(intent.maxFees[0].amount).toBe(fee.amount.toString())
      })

      it('uses default fee payer, deadline, nonce and settler if not explicitly set', () => {
        const target = Address.fromString(targetAddressStr)
        const settler = randomSettler(chainId)

        setContext(0, 1, userAddressStr, [settler], 'trigger-transfer')

        const intent = new IntentBuilder().addOperationBuilder(EvmCallBuilder.forChain(chainId).addCall(target)).build()

        expect(intent.operations.length).toBe(1)
        expect(intent.operations[0].user).toBe(userAddressStr)
        expect(intent.settler).toBe(settler.address.toString())
        expect(intent.feePayer).toBe(userAddressStr)
        expect(intent.deadline).toBe('300')
        expect(intent.nonce).toBe('0x')
      })

      it('stringifies the built intent', () => {
        const target = Address.fromString(targetAddressStr)
        const settler = Address.fromString(settlerAddressStr)
        const feePayer = Address.fromString(userAddressStr)

        setContext(0, 1, '0x0000000000000000000000000000000000000004', [], '1')

        const intent = new IntentBuilder()
          .addOperationBuilder(EvmCallBuilder.forChain(chainId).addCall(target, Bytes.fromHexString('0x1234')))
          .addSettler(settler)
          .addFeePayer(feePayer)
          .addDeadline(BigInt.fromString('123456789'))
          .addNonce('0xabcdef123456')
          .build()

        expect(JSON.stringify(intent)).toBe(
          `{"settler":"${settler}","feePayer":"${feePayer}","deadline":"123456789","nonce":"0xabcdef123456","maxFees":[],"operations":[{"opType":2,"chainId":${chainId},"user":"0x0000000000000000000000000000000000000004","events":[],"calls":[{"target":"${target}","data":"0x1234","value":"0"}]}]}`
        )
      })
    })

    describe('when the settler is zero', () => {
      it('throws an error', () => {
        const settler = new SerializableSettler(NULL_ADDRESS, chainId)
        setContext(0, 1, userAddressStr, [settler], 'trigger-call')

        expect(() => {
          new IntentBuilder()
            .addOperationBuilder(EvmCallBuilder.forChain(chainId).addCall(Address.fromString(targetAddressStr)))
            .build()
        }).toThrow('A settler contract must be specified')
      })
    })
  })

  describe('when the fee payer is zero', () => {
    const userAddressStr = NULL_ADDRESS

    it('throws an error', () => {
      const settler = randomSettler(chainId)
      setContext(0, 1, userAddressStr, [settler], 'trigger-call')

      expect(() => {
        new IntentBuilder()
          .addOperationBuilder(EvmCallBuilder.forChain(chainId).addCall(Address.fromString(targetAddressStr)))
          .build()
      }).toThrow('A fee payer must be specified')
    })
  })

  describe('when there are no operations', () => {
    it('throws an error', () => {
      const settler = randomSettler(chainId)
      setContext(0, 1, '0x0000000000000000000000000000000000000002', [settler], 'trigger-call')

      expect(() => {
        new IntentBuilder().build()
      }).toThrow('Operation list cannot be empty')
    })
  })
})
