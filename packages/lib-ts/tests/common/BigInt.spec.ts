import { BigInt, ByteArray, Bytes } from '../../common'
import { STANDARD_DECIMALS } from '../../constants'
import { buildZeroPadding, randomHex } from '../helpers'

describe('BigInt', () => {
  describe('zero', () => {
    describe('when calling the zero function', () => {
      it('returns a 4-byte BigInt where all bytes are zero', () => {
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
      it('creates a BigInt from signed bytes representation', () => {
        const bytes = Bytes.fromHexString(randomHex(8))
        const bigInt = BigInt.fromSignedBytes(bytes)
        expect(bigInt.length).toBe(4)
      })
    })
  })

  describe('fromByteArray', () => {
    describe('when creating a BigInt from a valid byte array', () => {
      it('creates a BigInt from the byte array representation', () => {
        const byteArray = ByteArray.fromHexString(randomHex(8))
        const bigInt = BigInt.fromByteArray(byteArray)
        expect(bigInt.length).toBe(4)
      })
    })

    describe('when creating a BigInt from an invalid byte array', () => {
      it('throws an error if the byte array has an invalid length', () => {
        expect(() => {
          const invalidByteArray = ByteArray.fromHexString(randomHex(3))
          BigInt.fromByteArray(invalidByteArray)
        }).toThrow()
      })
    })
  })

  describe('fromUnsignedBytes', () => {
    describe('when creating a BigInt from valid unsigned bytes', () => {
      it('creates a BigInt from unsigned bytes representation', () => {
        const bytes = Bytes.fromHexString(randomHex(8))
        const bigInt = BigInt.fromUnsignedBytes(bytes)
        expect(bigInt.length).toBeGreaterThanOrEqual(4)
      })
    })
  })

  describe('fromString', () => {
    describe('decimal notation', () => {
      it('parses a simple positive decimal string', () => {
        const result = BigInt.fromString('123')
        expect(result.toI32()).toBe(123)
      })

      it('parses a negative decimal string', () => {
        const result = BigInt.fromString('-456')
        expect(result.toI32()).toBe(-456)
      })

      it('returns zero for a plain "+" sign', () => {
        const result = BigInt.fromString('+')
        expect(result.isZero()).toBe(true)
      })

      it('ignores a decimal point and truncates the number', () => {
        const result = BigInt.fromString('12.34')
        expect(result.toI32()).toBe(12)
      })

      it('parses a large 30-digit decimal', () => {
        const big9 = BigInt.fromString('999999999999999999999999999999')
        const big9asString = big9.toString()
        expect(big9asString.length).toBe(30)
        for (let i = 0; i < big9asString.length; i++) {
          expect(big9asString.charAt(i)).toBe('9')
        }

        const big1 = BigInt.fromString('1e29')
        expect(big9.gt(big1)).toBe(true)
      })

      it('parses a large negative decimal', () => {
        const negBig = BigInt.fromString('-999999999999999999999999999999')
        expect(negBig.isZero()).toBe(false)
        expect(negBig.lt(BigInt.zero())).toBe(true)
      })
    })

    describe('hex notation', () => {
      it('parses a positive hex string (0x)', () => {
        const result = BigInt.fromString('0xFF')
        expect(result.toI32()).toBe(0xff)
      })

      it('parses a negative hex string (0x)', () => {
        const result = BigInt.fromString('-0x1a')
        expect(result.toI32()).toBe(-0x1a)
      })

      it('parses a positive hex string (0X)', () => {
        const result = BigInt.fromString('0XAB')
        expect(result.toI32()).toBe(0xab)
      })

      it('throws for an invalid hex character', () => {
        expect(() => {
          BigInt.fromString('0x1G')
        }).toThrow()
      })

      it('returns zero for just "0x" with no digits', () => {
        const result = BigInt.fromString('0x')
        expect(result.isZero()).toBe(true)
      })

      it('parses a large hex string (128-bit)', () => {
        const bigAllF = BigInt.fromString('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
        expect(bigAllF.isZero()).toBe(false)
      })
    })

    describe('scientific notation (decimal)', () => {
      it('parses a positive exponent', () => {
        const result = BigInt.fromString('1.23e2')
        expect(result.toI32()).toBe(123)
      })

      it('parses a negative exponent', () => {
        const result = BigInt.fromString('1000e-2')
        expect(result.toI32()).toBe(10)
      })

      it('parses a negative exponent leading to zero', () => {
        const result = BigInt.fromString('12e-3')
        expect(result.isZero()).toBe(true)
      })

      it('handles negative number with exponent', () => {
        const result = BigInt.fromString('-2.5E1')
        expect(result.toI32()).toBe(-25)
      })

      it('handles exponent sign', () => {
        const result = BigInt.fromString('3e+2')
        expect(result.toI32()).toBe(300)
      })

      it('parses scientific notation with a huge positive exponent', () => {
        const oneE40 = BigInt.fromString('1e40')
        expect(oneE40.isZero()).toBe(false)

        const all9_40 = BigInt.fromU64((1e40 - 1) as u64)
        expect(oneE40.gt(all9_40)).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('returns zero for an empty string', () => {
        const result = BigInt.fromString('')
        expect(result.isZero()).toBe(true)
      })

      it('throws when invalid characters are passed', () => {
        expect(() => {
          BigInt.fromString('abc')
        }).toThrow()
      })

      it('throws when used multiple signs', () => {
        expect(() => {
          BigInt.fromString('++123')
        }).toThrow()
      })
    })
  })

  describe('fromStringDecimal', () => {
    describe('when converting zero', () => {
      it('returns zero', () => {
        const zero = BigInt.fromStringDecimal('0', STANDARD_DECIMALS)
        expect(zero.isZero()).toBe(true)
      })
    })

    describe('when converting negative numbers', () => {
      it('converts negative small numbers correctly', () => {
        const amount = '-0.00001'
        const result = BigInt.fromStringDecimal(amount, 5)

        expect(result.toString()).toBe('-1')
      })

      it('converts negative integer numbers correctly', () => {
        const amount = '-100'
        const result = BigInt.fromStringDecimal(amount, 2)

        expect(result.toString()).toBe('-10000')
      })

      it('converts negative decimal numbers correctly', () => {
        const amount = '-100.5'
        const result = BigInt.fromStringDecimal(amount, 2)

        expect(result.toString()).toBe('-10050')
      })

      // TODO: fix scientific notation for decimals
      // it('converts negative decimal numbers with scientific notation correctly', () => {
      //   const amount = '-100.5e2'
      //   const result = BigInt.fromStringDecimal(amount, 2)
      //
      //   expect(result.toString()).toBe('-1005000')
      // })
    })

    describe('when converting positive numbers', () => {
      it('converts positive small numbers correctly', () => {
        const amount = '0.00001'
        const result = BigInt.fromStringDecimal(amount, 5)

        expect(result.toString()).toBe('1')
      })

      it('converts positive integer numbers correctly', () => {
        const amount = '100'
        const result = BigInt.fromStringDecimal(amount, 2)

        expect(result.toString()).toBe('10000')
      })

      it('converts positive decimal numbers correctly', () => {
        const amount = '100.5'
        const result = BigInt.fromStringDecimal(amount, 2)

        expect(result.toString()).toBe('10050')
      })

      // TODO: fix scientific notation for decimals
      // it('converts positive decimal numbers with scientific notation correctly', () => {
      //   const amount = '100.5e2'
      //   const result = BigInt.fromStringDecimal(amount, 2)
      //
      //   expect(result.toString()).toBe('1005000')
      // })
    })

    describe('when handling invalid inputs', () => {
      it('throws an error when amount has multiple decimal points', () => {
        expect(() => {
          const invalidAmount = '100.45.67'
          BigInt.fromStringDecimal(invalidAmount, 2)
        }).toThrow()
      })

      it('throws an error when amount has non-numeric characters', () => {
        expect(() => {
          const invalidAmount = '100a02'
          BigInt.fromStringDecimal(invalidAmount, 2)
        }).toThrow()

        expect(() => {
          const invalidAmount = '10.0a02'
          BigInt.fromStringDecimal(invalidAmount, 2)
        }).toThrow()
      })
    })
  })

  describe('operators', () => {
    describe('plus', () => {
      it('adds two positive BigInts', () => {
        const exponent: u8 = 20
        const a = BigInt.fromString('1e' + exponent.toString())
        const b = BigInt.fromString('2e' + exponent.toString())
        const sum = a.plus(b)
        expect(sum.toString()).toBe('3' + buildZeroPadding(exponent))
      })

      it('adds a positive and a negative BigInt', () => {
        const a = BigInt.fromU64(10 ** 18)
        const b = BigInt.fromI32(-5)
        const sum = a.plus(b)
        expect(sum.toU64()).toBe(10 ** 18 - 5)
      })

      it('adds two large BigInts', () => {
        const exponent: u8 = 38
        const a = BigInt.fromString('1e' + exponent.toString())
        const b = BigInt.fromString('1e' + exponent.toString())
        const sum = a.plus(b)
        expect(sum.toString()).toBe('2' + buildZeroPadding(exponent))
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
        const a = BigInt.fromU64(10 ** 15)
        const b = BigInt.fromString('1e20')
        const diff = a.minus(b)
        expect(diff.toString()).toBe('-99999000000000000000')
      })

      it('subtracts two large BigInts', () => {
        const exponent: u8 = 37
        const a = BigInt.fromString('1e' + (exponent + 1).toString())
        const b = BigInt.fromString('1e' + exponent.toString())
        const diff = a.minus(b)
        expect(diff.toString()).toBe('9' + buildZeroPadding(exponent))
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

      it('multiplies two negative BigInts', () => {
        const a = BigInt.fromI32(-2)
        const b = BigInt.fromI32(-6)
        const prod = a.times(b)
        expect(prod.toI32()).toBe(12)
      })

      it('multiplies two large BigInts', () => {
        const exponent: u8 = 19
        const a = BigInt.fromString('1e' + exponent.toString())
        const b = BigInt.fromString('1e' + exponent.toString())
        const prod = a.times(b)
        expect(prod.toString()).toBe('1' + buildZeroPadding(exponent * 2))
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

      it('divides two negative BigInts', () => {
        const a = BigInt.fromI32(-25)
        const b = BigInt.fromI32(-5)
        const quotient = a.div(b)
        expect(quotient.toI32()).toBe(5)
      })

      it('throws when dividing by zero', () => {
        expect(() => {
          const a = BigInt.fromI32(10)
          const b = BigInt.zero()
          a.div(b)
        }).toThrow()
      })

      it('divides two large BigInts', () => {
        const expA: u8 = 38
        const expB: u8 = 18
        const a = BigInt.fromString('1e' + expA.toString())
        const b = BigInt.fromString('1e' + expB.toString())
        const quotient = a.div(b)
        expect(quotient.toString()).toBe('1' + buildZeroPadding(expA - expB))
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

      it('handles large numbers with exponentiation', () => {
        const a = BigInt.fromI32(10)
        const exponent: u8 = 30
        const result = a.pow(exponent)
        expect(result.toString()).toBe('1' + buildZeroPadding(exponent))
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

  describe('toStringDecimal', () => {
    describe('when converting a positive bigint to decimal string', () => {
      it('converts with specified precision', () => {
        const value = BigInt.fromI32(12345)
        expect(value.toStringDecimal(2)).toBe('123.45')
        expect(value.toStringDecimal(3)).toBe('12.345')
        expect(value.toStringDecimal(5)).toBe('0.12345')
      })

      it('handles positive integer numbers correctly', () => {
        const value = BigInt.fromString('100')
        expect(value.toStringDecimal(2)).toBe('1')
      })

      it('handles positive decimal numbers correctly', () => {
        const value = BigInt.fromString('10050')
        expect(value.toStringDecimal(2)).toBe('100.5')
      })

      it('handles large positive decimal numbers correctly', () => {
        const value = BigInt.fromString('10050')
        expect(value.toStringDecimal(18)).toBe('0.00000000000001005')
      })

      it('handles values smaller than the precision correctly', () => {
        const value = BigInt.fromI32(123)
        expect(value.toStringDecimal(5)).toBe('0.00123')
      })
    })

    describe('when converting a negative bigint to decimal string', () => {
      it('converts with specified precision', () => {
        const value = BigInt.fromI32(-12345)
        expect(value.toStringDecimal(2)).toBe('-123.45')
        expect(value.toStringDecimal(3)).toBe('-12.345')
        expect(value.toStringDecimal(5)).toBe('-0.12345')
      })

      it('handles negative integer numbers correctly', () => {
        const value = BigInt.fromString('-100')
        expect(value.toStringDecimal(2)).toBe('-1')
      })

      it('handles negative decimal numbers correctly', () => {
        const value = BigInt.fromString('-10050')
        expect(value.toStringDecimal(2)).toBe('-100.5')
      })

      it('handles large negative decimal numbers correctly', () => {
        const value = BigInt.fromString('-10050')
        expect(value.toStringDecimal(18)).toBe('-0.00000000000001005')
      })
    })

    describe('when converting zero', () => {
      it('returns zero', () => {
        const zero = BigInt.zero()
        expect(zero.toStringDecimal(STANDARD_DECIMALS)).toBe('0')
        expect(zero.toStringDecimal(2)).toBe('0')
        expect(zero.toStringDecimal(5)).toBe('0')
      })
    })
  })

  describe('fromStringDecimal', () => {
    describe('when converting a positive decimal string to bigint', () => {
      it('converts with specified precision', () => {
        expect(BigInt.fromStringDecimal('123.45', 2).toI32()).toBe(12345)
        expect(BigInt.fromStringDecimal('12.345', 3).toI32()).toBe(12345)
        expect(BigInt.fromStringDecimal('0.12345', 5).toI32()).toBe(12345)
      })

      it('converts positive small numbers correctly', () => {
        const amount = '0.00001'
        const result = BigInt.fromStringDecimal(amount, 5)
        expect(result.toString()).toBe('1')
      })

      it('converts positive integer numbers correctly', () => {
        const amount = '100'
        const result = BigInt.fromStringDecimal(amount, 2)
        expect(result.toString()).toBe('10000')
      })

      it('converts positive decimal numbers correctly', () => {
        const amount = '100.5'
        const result = BigInt.fromStringDecimal(amount, 2)
        expect(result.toString()).toBe('10050')
      })

      it('handles strings without decimal points', () => {
        expect(BigInt.fromStringDecimal('123', 2).toI32()).toBe(12300)
      })

      it('handles strings with more decimal places than the precision', () => {
        expect(BigInt.fromStringDecimal('0.12345', 3).toI32()).toBe(123)
      })
    })

    describe('when converting a negative decimal string to bigint', () => {
      it('converts with specified precision', () => {
        expect(BigInt.fromStringDecimal('-123.45', 2).toI32()).toBe(-12345)
        expect(BigInt.fromStringDecimal('-12.345', 3).toI32()).toBe(-12345)
        expect(BigInt.fromStringDecimal('-0.12345', 5).toI32()).toBe(-12345)
      })

      it('converts negative small numbers correctly', () => {
        const amount = '-0.00001'
        const result = BigInt.fromStringDecimal(amount, 5)
        expect(result.toString()).toBe('-1')
      })

      it('converts negative integer numbers correctly', () => {
        const amount = '-100'
        const result = BigInt.fromStringDecimal(amount, 2)
        expect(result.toString()).toBe('-10000')
      })

      it('converts negative decimal numbers correctly', () => {
        const amount = '-100.5'
        const result = BigInt.fromStringDecimal(amount, 2)
        expect(result.toString()).toBe('-10050')
      })
    })

    describe('when converting zero', () => {
      it('returns zero', () => {
        const zero = BigInt.fromStringDecimal('0', STANDARD_DECIMALS)
        expect(zero.isZero()).toBe(true)
        expect(BigInt.fromStringDecimal('0.00', 2).isZero()).toBe(true)
        expect(BigInt.fromStringDecimal('0', 5).isZero()).toBe(true)
      })
    })

    describe('when handling invalid inputs', () => {
      it('throws an error when amount has multiple decimal points', () => {
        expect(() => {
          const invalidAmount = '100.45.67'
          BigInt.fromStringDecimal(invalidAmount, 2)
        }).toThrow()
      })

      it('throws an error when amount has non-numeric characters', () => {
        expect(() => {
          const invalidAmount = '100a02'
          BigInt.fromStringDecimal(invalidAmount, 2)
        }).toThrow()

        expect(() => {
          const invalidAmount = '10.0a02'
          BigInt.fromStringDecimal(invalidAmount, 2)
        }).toThrow()

        expect(() => {
          BigInt.fromStringDecimal('abc', 2)
        }).toThrow()
      })
    })
  })

  describe('upscale and downscale', () => {
    describe('when upscaling a bigint', () => {
      it('upscales by the specified precision', () => {
        const value = BigInt.fromI32(123)
        expect(value.upscale(2).toI32()).toBe(12300)
        expect(value.upscale(5).toI32()).toBe(12300000)
      })

      it('handles zero correctly', () => {
        const zero = BigInt.fromI32(0)
        expect(zero.upscale(5).isZero()).toBe(true)
      })

      it('maintains the sign when upscaling', () => {
        const negative = BigInt.fromI32(-123)
        expect(negative.upscale(2).toI32()).toBe(-12300)
      })
    })

    describe('when downscaling a bigint', () => {
      it('downscales by the specified precision', () => {
        const value = BigInt.fromI32(12345)
        expect(value.downscale(2).toI32()).toBe(123)
        expect(value.downscale(3).toI32()).toBe(12)
      })

      it('handles zero correctly', () => {
        const zero = BigInt.fromI32(0)
        expect(zero.downscale(5).isZero()).toBe(true)
      })

      it('maintains the sign when downscaling', () => {
        const negative = BigInt.fromI32(-123)
        expect(negative.downscale(1).toI32()).toBe(-12)
      })
    })
  })
})
