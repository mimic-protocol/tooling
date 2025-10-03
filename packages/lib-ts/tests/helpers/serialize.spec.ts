import { Trigger } from '../../src/context'
import { NULL_ADDRESS, serialize } from '../../src/helpers'
import { Address, BigInt, Bytes } from '../../src/types'
import { setEvmDecode } from '../helpers'

describe('serialize', () => {
  describe('serialize', () => {
    describe('when passing an Address', () => {
      it('converts it to string correctly', () => {
        const address = Address.zero()
        const serialized = serialize(address)
        expect(serialized).toBe(NULL_ADDRESS)
      })
    })

    describe('when passing Bytes', () => {
      it('converts it to string correctly', () => {
        const bytes = Bytes.fromI32(5)
        const serialized = serialize(bytes)
        expect(serialized).toBe('0x05000000')
      })
    })

    describe('when passing a BigInt', () => {
      it('converts it to string correctly', () => {
        const bigInt = BigInt.fromI32(5)
        const serialized = serialize(bigInt)
        expect(serialized).toBe('5')
      })

      it('converts a negative BigInt to string correctly', () => {
        const bigInt = BigInt.fromI32(-5)
        const serialized = serialize(bigInt)
        expect(serialized).toBe('-5')
      })
    })

    describe('when passing a number', () => {
      it('converts it to string correctly', () => {
        const num = 5
        const serialized = serialize(num)
        expect(serialized).toBe('5')
      })
    })
  })

  describe('deserializeCronTriggerData', () => {
    it('decodes a uint256 correctly', () => {
      const data = '0x0000000000000000000000000000000000000000000000000000019962bc6d60'
      setEvmDecode('uint256', '0x0000000000000000000000000000000000000000000000000000019962bc6d60', '1758298140000')
      const deserialized = Trigger.deserializeCronTriggerData(data)
      expect(deserialized.toString()).toBe('1758298140000')
    })
  })

  describe('deserializeEventTriggerData', () => {
    it('decodes the event correctly', () => {
      const data =
        '0x0000000000000000000000000000000000000000000000000000000000000020e171661125168440ba1f1eb114291cbbe6f55e99f7d1612e9f6786d3941049720000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001dcf810f941d3680038937e197031e3fd9716dbe6aa0c31ea2ad35cf4c457a6cc0000000000000000000000000000000000000000000000000000000000000040380ad672d259b4a3ae2d55e3704eafcefffc1e69dcd9cf952dd14670cd28e81324e9127ac0c37b8e8c140116fd30fa5f9e96b0e9e680e914614889f12896123c'
      setEvmDecode(
        '(bytes32,uint256,bytes32[],bytes)',
        data,
        '["0xe171661125168440ba1f1eb114291cbbe6f55e99f7d1612e9f6786d394104972","2","[\\"0xdcf810f941d3680038937e197031e3fd9716dbe6aa0c31ea2ad35cf4c457a6cc\\"]","0x380ad672d259b4a3ae2d55e3704eafcefffc1e69dcd9cf952dd14670cd28e81324e9127ac0c37b8e8c140116fd30fa5f9e96b0e9e680e914614889f12896123c"]'
      )
      const event = Trigger.deserializeEventTriggerData(data)
      expect(event.blockHash).toBe('0xe171661125168440ba1f1eb114291cbbe6f55e99f7d1612e9f6786d394104972')
      expect(event.index).toBe(BigInt.fromStringDecimal('2', 0))
      expect(event.topics.length).toBe(1)
      expect(event.topics[0]).toBe('0xdcf810f941d3680038937e197031e3fd9716dbe6aa0c31ea2ad35cf4c457a6cc')
      expect(event.eventData).toBe(
        '0x380ad672d259b4a3ae2d55e3704eafcefffc1e69dcd9cf952dd14670cd28e81324e9127ac0c37b8e8c140116fd30fa5f9e96b0e9e680e914614889f12896123c'
      )
    })
  })
})
