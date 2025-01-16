import { BigInt } from '../../common/BigInt'
import { ByteArray } from '../../common/ByteArray'
import { Bytes } from '../../common/Bytes'
import { getHexString } from '../helpers'

describe('BigInt', () => {
  describe('zero', () => {
    describe('when calling the zero function', () => {
      it('returns a 4-byte BigInt where all bytes are zero', (): void => {
        const zeroBigInt = BigInt.zero()
        expect(zeroBigInt.length).toBe(4)
        expect(zeroBigInt[0]).toBe(0)
        expect(zeroBigInt[1]).toBe(0)
        expect(zeroBigInt[2]).toBe(0)
        expect(zeroBigInt[3]).toBe(0)
      })
    })
  })

  describe('fromSignedBytes', () => {
    describe('when creating a BigInt from valid signed bytes', () => {
      it('creates a BigInt from signed bytes representation', (): void => {
        const bytes = Bytes.fromHexString(getHexString(8))
        const bigInt = BigInt.fromSignedBytes(bytes)
        expect(bigInt.length).toBe(4)
      })
    })
  })

  describe('fromByteArray', () => {
    describe('when creating a BigInt from a valid byte array', () => {
      it('creates a BigInt from the byte array representation', (): void => {
        const byteArray = ByteArray.fromHexString(getHexString(8))
        const bigInt = BigInt.fromByteArray(byteArray)
        expect(bigInt.length).toBe(4)
      })
    })

    describe('when creating a BigInt from an invalid byte array', () => {
      it('throws an error if the byte array has an invalid length', (): void => {
        expect((): void => {
          const invalidByteArray = ByteArray.fromHexString(getHexString(3))
          BigInt.fromByteArray(invalidByteArray)
        }).toThrow()
      })
    })
  })

  describe('fromUnsignedBytes', () => {
    describe('when creating a BigInt from valid unsigned bytes', () => {
      it('creates a BigInt from unsigned bytes representation', (): void => {
        const bytes = Bytes.fromHexString(getHexString(8))
        const bigInt = BigInt.fromUnsignedBytes(bytes)
        expect(bigInt.length).toBeGreaterThanOrEqual(4)
      })
    })
  })
})
