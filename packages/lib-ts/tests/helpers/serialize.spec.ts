import { join, NULL_ADDRESS, serialize, serializeArray } from '../../src/helpers'
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
        expect(serialized).toBe('BigInt(5)')
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

  describe('join', () => {
    describe('when passing a list of strings', () => {
      it('returns them joined', () => {
        const joint = join(['one', 'two', 'three'])
        expect(joint).toBe('one,two,three')
      })
    })

    describe('when passing a list of nulls', () => {
      it('returns them joined', () => {
        const joint = join([null, null, null])
        expect(joint).toBe(',,')
      })
    })

    describe('when passing a mixed list', () => {
      it('returns them joined', () => {
        const joint = join(['one', null, 'three'])
        expect(joint).toBe('one,,three')
      })
    })
  })

  describe('serializeArray', () => {
    describe('when passing an array of Addresses', () => {
      it('converts it to string correctly', () => {
        const addresses = [Address.zero(), Address.zero()]
        const serialized = serializeArray(addresses)
        expect(serialized).toBe(`Array(${NULL_ADDRESS},${NULL_ADDRESS})`)
      })
    })

    describe('when passing an array of Bytes', () => {
      it('converts it to string correctly', () => {
        const bytesArray = [Bytes.fromI32(5), Bytes.fromI32(10)]
        const serialized = serializeArray(bytesArray)
        expect(serialized).toBe('Array(0x05000000,0x0a000000)')
      })
    })

    describe('when passing an array of BigInts', () => {
      it('converts it to string correctly', () => {
        const bigInts = [BigInt.fromI32(5), BigInt.fromI32(10)]
        const serialized = serializeArray(bigInts)
        expect(serialized).toBe('Array(BigInt(5),BigInt(10))')
      })
    })

    describe('when passing an array of numbers', () => {
      it('converts it to string correctly', () => {
        const numbers = [5, 10, 15]
        const serialized = serializeArray(numbers)
        expect(serialized).toBe('Array(5,10,15)')
      })
    })

    describe('when passing an empty array', () => {
      it('returns Array()', () => {
        const empty: number[] = []
        const serialized = serializeArray(empty)
        expect(serialized).toBe('Array()')
      })
    })
  })
})
