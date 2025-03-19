import { BigInt, ByteArray } from '../../common'

describe('ByteArray', () => {
  describe('empty', () => {
    describe('when calling the empty method', () => {
      it('returns a ByteArray initialized to 0', (): void => {
        const result = ByteArray.empty()
        expect(result.length).toBe(4)
        expect(result[0]).toBe(0)
        expect(result[1]).toBe(0)
        expect(result[2]).toBe(0)
        expect(result[3]).toBe(0)
      })
    })
  })

  describe('fromHexString', () => {
    describe('when creating a ByteArray from a valid hex string', () => {
      it('creates a ByteArray with the expected values', (): void => {
        const hex = '0x01020304'
        const result = ByteArray.fromHexString(hex)
        expect(result.length).toBe(4)
        expect(result[0]).toBe(0x01)
        expect(result[1]).toBe(0x02)
        expect(result[2]).toBe(0x03)
        expect(result[3]).toBe(0x04)
      })
    })

    describe('when the hex string has an odd length', () => {
      it('throws an assertion error', (): void => {
        expect((): void => {
          ByteArray.fromHexString('0x123')
        }).toThrow('input 0x123 has odd length')
      })
    })
  })

  describe('fromUTF8', () => {
    describe('when creating a ByteArray from a valid UTF-8 string', () => {
      it('creates a ByteArray with the encoded UTF-8 bytes', (): void => {
        const str = 'test'
        const result = ByteArray.fromUTF8(str)
        expect(result.length).toBe(4)
        expect(result[0]).toBe(0x74) // 't'
        expect(result[1]).toBe(0x65) // 'e'
        expect(result[2]).toBe(0x73) // 's'
        expect(result[3]).toBe(0x74) // 't'
      })
    })
  })

  describe('fromBigInt', () => {
    describe('when creating a ByteArray from a BigInt', () => {
      it('creates a ByteArray from the given BigInt', (): void => {
        const bigInt = BigInt.fromI64(0x0102030405060708)
        const result = ByteArray.fromBigInt(bigInt)
        expect(result.length).toBe(8)
        expect(result[0]).toBe(0x08)
        expect(result[1]).toBe(0x07)
        expect(result[2]).toBe(0x06)
        expect(result[3]).toBe(0x05)
        expect(result[4]).toBe(0x04)
        expect(result[5]).toBe(0x03)
        expect(result[6]).toBe(0x02)
        expect(result[7]).toBe(0x01)
      })
    })
  })

  describe('toHexString', () => {
    describe('when converting a ByteArray to a string representation of hex', () => {
      it('returns the expected hex string', (): void => {
        const hexStr = '0x01020304'
        const byteArray = ByteArray.fromHexString(hexStr)
        const recoveredHexStr = byteArray.toHexString()
        expect(recoveredHexStr).toBe(hexStr)
      })
    })
  })

  describe('fromI32', () => {
    describe('when creating a ByteArray from a valid i32', () => {
      it('creates a 4-byte ByteArray in little-endian order', (): void => {
        const value: i32 = 0x01020304
        const result = ByteArray.fromI32(value)
        expect(result.length).toBe(4)
        expect(result[0]).toBe(0x04)
        expect(result[1]).toBe(0x03)
        expect(result[2]).toBe(0x02)
        expect(result[3]).toBe(0x01)
      })
    })
  })

  describe('fromU32', () => {
    describe('when creating a ByteArray from a valid u32', () => {
      it('creates a 4-byte ByteArray in little-endian order', (): void => {
        const value: u32 = 0x01020304
        const result = ByteArray.fromU32(value)
        expect(result.length).toBe(4)
        expect(result[0]).toBe(0x04)
        expect(result[1]).toBe(0x03)
        expect(result[2]).toBe(0x02)
        expect(result[3]).toBe(0x01)
      })
    })
  })

  describe('fromI64', () => {
    describe('when creating a ByteArray from a valid i64', () => {
      it('creates an 8-byte ByteArray in little-endian order', (): void => {
        const value: i64 = 0x0102030405060708
        const result = ByteArray.fromI64(value)
        expect(result.length).toBe(8)
        expect(result[0]).toBe(0x08)
        expect(result[1]).toBe(0x07)
        expect(result[2]).toBe(0x06)
        expect(result[3]).toBe(0x05)
        expect(result[4]).toBe(0x04)
        expect(result[5]).toBe(0x03)
        expect(result[6]).toBe(0x02)
        expect(result[7]).toBe(0x01)
      })
    })
  })

  describe('fromU64', () => {
    describe('when creating a ByteArray from a valid u64', () => {
      it('creates an 8-byte ByteArray in little-endian order', (): void => {
        const value: u64 = 0x0102030405060708
        const result = ByteArray.fromU64(value)
        expect(result.length).toBe(8)
        expect(result[0]).toBe(0x08)
        expect(result[1]).toBe(0x07)
        expect(result[2]).toBe(0x06)
        expect(result[3]).toBe(0x05)
        expect(result[4]).toBe(0x04)
        expect(result[5]).toBe(0x03)
        expect(result[6]).toBe(0x02)
        expect(result[7]).toBe(0x01)
      })
    })
  })

  describe('when using limit values', () => {
    it('can create a ByteArray from i32.MAX_VALUE', () => {
      const array = ByteArray.fromI32(i32.MAX_VALUE)
      expect(array.length).toBe(4)
      expect(array[0]).toBe(0xff)
      expect(array[1]).toBe(0xff)
      expect(array[2]).toBe(0xff)
      expect(array[3]).toBe(0x7f)
    })

    it('can create a ByteArray from i32.MIN_VALUE', () => {
      const array = ByteArray.fromI32(i32.MIN_VALUE)
      expect(array.length).toBe(4)
      expect(array[0]).toBe(0x00)
      expect(array[1]).toBe(0x00)
      expect(array[2]).toBe(0x00)
      expect(array[3]).toBe(0x80)
    })

    it('can create a ByteArray from i64.MAX_VALUE', () => {
      const array = ByteArray.fromI64(i64.MAX_VALUE)
      expect(array.length).toBe(8)
      expect(array[0]).toBe(0xff)
      expect(array[1]).toBe(0xff)
      expect(array[2]).toBe(0xff)
      expect(array[3]).toBe(0xff)
      expect(array[4]).toBe(0xff)
      expect(array[5]).toBe(0xff)
      expect(array[6]).toBe(0xff)
      expect(array[7]).toBe(0x7f)
    })

    it('can create a ByteArray from i64.MIN_VALUE', () => {
      const array = ByteArray.fromI64(i64.MIN_VALUE)
      expect(array.length).toBe(8)
      expect(array[0]).toBe(0x00)
      expect(array[1]).toBe(0x00)
      expect(array[2]).toBe(0x00)
      expect(array[3]).toBe(0x00)
      expect(array[4]).toBe(0x00)
      expect(array[5]).toBe(0x00)
      expect(array[6]).toBe(0x00)
      expect(array[7]).toBe(0x80)
    })

    it('wraps i32.MAX_VALUE + 1 to i32.MIN_VALUE', () => {
      let val = i32.MAX_VALUE
      val += 1
      const arr = ByteArray.fromI32(val)
      expect(arr.toI32()).toBe(i32.MIN_VALUE)
    })

    it('wraps i32.MIN_VALUE - 1 to i32.MAX_VALUE', () => {
      let val = i32.MIN_VALUE
      val -= 1
      const arr = ByteArray.fromI32(val)
      expect(arr.toI32()).toBe(i32.MAX_VALUE)
    })
  })
})
