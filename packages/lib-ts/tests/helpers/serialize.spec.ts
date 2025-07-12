import { NULL_ADDRESS, serialize } from '../../src/helpers'
import { Address, BigInt, Bytes } from '../../src/types'

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
})
