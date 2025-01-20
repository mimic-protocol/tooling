import { BigInt } from '../../common/BigInt'
import { ByteArray } from '../../common/ByteArray'
import { Bytes } from '../../common/Bytes'
import { randomHex } from '../helpers'

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
        const bytes = Bytes.fromHexString(randomHex(8))
        const bigInt = BigInt.fromSignedBytes(bytes)
        expect(bigInt.length).toBe(4)
      })
    })
  })

  describe('fromByteArray', () => {
    describe('when creating a BigInt from a valid byte array', () => {
      it('creates a BigInt from the byte array representation', (): void => {
        const byteArray = ByteArray.fromHexString(randomHex(8))
        const bigInt = BigInt.fromByteArray(byteArray)
        expect(bigInt.length).toBe(4)
      })
    })

    describe('when creating a BigInt from an invalid byte array', () => {
      it('throws an error if the byte array has an invalid length', (): void => {
        expect((): void => {
          const invalidByteArray = ByteArray.fromHexString(randomHex(3))
          BigInt.fromByteArray(invalidByteArray)
        }).toThrow()
      })
    })
  })

  describe('fromUnsignedBytes', () => {
    describe('when creating a BigInt from valid unsigned bytes', () => {
      it('creates a BigInt from unsigned bytes representation', (): void => {
        const bytes = Bytes.fromHexString(randomHex(8))
        const bigInt = BigInt.fromUnsignedBytes(bytes)
        expect(bigInt.length).toBeGreaterThanOrEqual(4)
      })
    })
  })

  describe('operators', () => {
    describe('plus', () => {
      it('adds two positive BigInts', () => {
        const a = BigInt.fromI32(10)
        const b = BigInt.fromI32(20)
        const sum = a.plus(b)
        expect(sum.toI32()).toBe(30)
      })

      it('adds a positive and a negative BigInt', () => {
        const a = BigInt.fromI32(10)
        const b = BigInt.fromI32(-5)
        const sum = a.plus(b)
        expect(sum.toI32()).toBe(5)
      })
    })

    describe('minus', () => {
      it('subtracts two positive BigInts', () => {
        const a = BigInt.fromI32(20)
        const b = BigInt.fromI32(10)
        const diff = a.minus(b)
        expect(diff.toI32()).toBe(10)
      })

      it('subtracts and results in a negative BigInt', () => {
        const a = BigInt.fromI32(5)
        const b = BigInt.fromI32(10)
        const diff = a.minus(b)
        expect(diff.toI32()).toBe(-5)
      })
    })

    describe('times', () => {
      it('multiplies two positive BigInts', () => {
        const a = BigInt.fromI32(3)
        const b = BigInt.fromI32(4)
        const prod = a.times(b)
        expect(prod.toI32()).toBe(12)
      })

      it('multiplies a positive by a negative BigInt', () => {
        const a = BigInt.fromI32(-2)
        const b = BigInt.fromI32(6)
        const prod = a.times(b)
        expect(prod.toI32()).toBe(-12)
      })
    })

    describe('div', () => {
      it('divides two positive BigInts', () => {
        const a = BigInt.fromI32(50)
        const b = BigInt.fromI32(5)
        const quotient = a.div(b)
        expect(quotient.toI32()).toBe(10)
      })

      it('divides when result is negative', () => {
        const a = BigInt.fromI32(-25)
        const b = BigInt.fromI32(5)
        const quotient = a.div(b)
        expect(quotient.toI32()).toBe(-5)
      })

      it('throws when dividing by zero', () => {
        expect(() => {
          const a = BigInt.fromI32(10)
          const b = BigInt.zero()
          a.div(b)
        }).toThrow()
      })
    })

    describe('mod', () => {
      it('calculates the remainder of two positive BigInts', () => {
        const a = BigInt.fromI32(11)
        const b = BigInt.fromI32(3)
        const remainder = a.mod(b)
        expect(remainder.toI32()).toBe(2)
      })

      it('calculates the remainder of a negative BigInt', () => {
        const a = BigInt.fromI32(-11)
        const b = BigInt.fromI32(3)
        const remainder = a.mod(b)
        expect(remainder.toI32()).toBe(-2)
      })

      it('throws when modulo by zero', () => {
        expect(() => {
          const a = BigInt.fromI32(10)
          const b = BigInt.zero()
          a.mod(b)
        }).toThrow()
      })
    })

    describe('bitOr', () => {
      it('performs bitwise OR on two positive BigInts', () => {
        const a = BigInt.fromI32(0b1010)
        const b = BigInt.fromI32(0b1100)
        const result = a.bitOr(b)
        expect(result.toI32()).toBe(0b1110)
      })

      it('performs bitwise OR on a negative and a positive BigInt', () => {
        const a = BigInt.fromI32(-1)
        const b = BigInt.fromI32(0)
        const result = a.bitOr(b)
        expect(result.toI32()).toBe(-1)
      })
    })

    describe('bitAnd', () => {
      it('performs bitwise AND on two positive BigInts', () => {
        const a = BigInt.fromI32(0b1010)
        const b = BigInt.fromI32(0b1100)
        const result = a.bitAnd(b)
        expect(result.toI32()).toBe(0b1000)
      })

      it('performs bitwise AND on a negative and a positive BigInt', () => {
        const a = BigInt.fromI32(-1)
        const b = BigInt.fromI32(0b1010)
        const result = a.bitAnd(b)
        expect(result.toI32()).toBe(0b1010)
      })
    })

    describe('leftShift', () => {
      it('left shifts a positive BigInt by 1 bit', () => {
        const a = BigInt.fromI32(0b101)
        const shifted = a.leftShift(1)
        expect(shifted.toI32()).toBe(0b1010)
      })

      it('left shifts a positive BigInt by 3 bits', () => {
        const a = BigInt.fromI32(1)
        const shifted = a.leftShift(3)
        expect(shifted.toI32()).toBe(8)
      })
    })

    describe('rightShift', () => {
      it('right shifts a positive BigInt by 1 bit', () => {
        const a = BigInt.fromI32(0b1010)
        const shifted = a.rightShift(1)
        expect(shifted.toI32()).toBe(0b101)
      })

      it('right shifts a negative BigInt (arithmetic shift)', () => {
        // -8 in binary is 0xF8 (on 8 bits, ignoring sign extension beyond that)
        const a = BigInt.fromI32(-8)
        const shifted = a.rightShift(1)
        // arithmetic right shift preserves sign => should be -4
        expect(shifted.toI32()).toBe(-4)
      })
    })

    describe('pow', () => {
      it('returns the correct result for 2^3', () => {
        const a = BigInt.fromI32(2)
        const result = a.pow(3)
        expect(result.toI32()).toBe(8)
      })

      it('returns 1 for anything ^ 0', () => {
        const a = BigInt.fromI32(7)
        const result = a.pow(0)
        expect(result.toI32()).toBe(1)
      })
    })

    describe('when using comparison operators', () => {
      it('checks equality (==) for two equal BigInts', () => {
        const a = BigInt.fromI32(10)
        const b = BigInt.fromI32(10)
        expect(a == b).toBe(true)
        expect(a != b).toBe(false)
      })

      it('checks inequality (!=) for two different BigInts', () => {
        const a = BigInt.fromI32(10)
        const b = BigInt.fromI32(15)
        expect(a != b).toBe(true)
        expect(a == b).toBe(false)
      })

      it('checks less than (<) and greater than (>)', () => {
        const a = BigInt.fromI32(-5)
        const b = BigInt.fromI32(0)
        expect(a < b).toBe(true)
        expect(b < a).toBe(false)
        expect(b > a).toBe(true)
      })

      it('checks <= and >=', () => {
        const a = BigInt.fromI32(10)
        const b = BigInt.fromI32(10)
        expect(a <= b).toBe(true)
        expect(a >= b).toBe(true)
        const c = BigInt.fromI32(9)
        expect(c <= b).toBe(true)
        expect(b >= c).toBe(true)
      })
    })
  })
})
