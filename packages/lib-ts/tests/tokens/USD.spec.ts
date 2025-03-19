import { STANDARD_DECIMALS } from '../../src/helpers'
import { USD } from '../../src/tokens'
import { BigInt } from '../../src/types'
import { randomToken, randomTokenWithPrice, zeroPadded } from '../helpers'

describe('USD', () => {
  describe('fromI32', () => {
    it('creates using integers properly', () => {
      const amountUsd = USD.fromI32(100)
      expect(amountUsd.toString()).toBe('100')
    })

    it('throws an error when creating with a negative amount', () => {
      expect(() => {
        USD.fromI32(-10)
      }).toThrow('USD cannot be negative')
    })
  })

  describe('fromStringDecimal', () => {
    it('correctly scales the amount with standard decimals', () => {
      const amount = '123.45'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.value.toString()).toBe('123450000000000000000')
    })

    it('handles whole numbers correctly', () => {
      const amount = '100'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.value.toString()).toBe('100000000000000000000')
    })

    it('handles zero correctly', () => {
      const amount = '0'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.value.toString()).toBe('0')
      expect(usd.isZero()).toBe(true)
    })

    it('handles large numbers', () => {
      const amount = '1234567.89'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.value.toString()).toBe('1234567890000000000000000')
    })

    it('handles small decimal fractions', () => {
      const amount = '0.000001'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.value.toString()).toBe('1000000000000')
    })

    it('throws an error when amount has multiple decimal points', () => {
      expect(() => {
        const invalidAmount = '100.45.67'
        USD.fromStringDecimal(invalidAmount)
      }).toThrow()
    })
  })

  describe('fromBigInt', () => {
    it('creates a clone of the amount to prevent mutation', () => {
      const originalAmount = BigInt.fromI32(100)
      const amountUsd = USD.fromBigInt(originalAmount)
      const modifiedAmount = amountUsd.value
      modifiedAmount[0] = 2

      expect(amountUsd.value.equals(originalAmount)).toBe(true)
      expect(amountUsd.value.equals(modifiedAmount)).toBe(false)
    })
  })

  describe('isZero', () => {
    it('returns true when amount is zero', () => {
      const usdAmount = USD.zero()
      expect(usdAmount.isZero()).toBe(true)
    })

    it('returns false when amount is not zero', () => {
      const usdAmount = USD.fromI32(1)
      expect(usdAmount.isZero()).toBe(false)
    })
  })

  describe('plus', () => {
    it('adds two amounts properly', () => {
      const usdAmount1 = USD.fromI32(100)
      const usdAmount2 = USD.fromI32(50)

      const result = usdAmount1.plus(usdAmount2)
      expect(result.toString()).toBe('150')
    })
  })

  describe('minus', () => {
    it('subtracts two amounts properly', () => {
      const usdAmount1 = USD.fromI32(100)
      const usdAmount2 = USD.fromI32(50)

      const result = usdAmount1.minus(usdAmount2)
      expect(result.toString()).toBe('50')
    })

    it('throws an error when the result is negative', () => {
      expect(() => {
        const usdAmount1 = USD.fromI32(100)
        const usdAmount2 = USD.fromI32(500)

        usdAmount1.minus(usdAmount2)
      }).toThrow('USD cannot be negative')
    })
  })

  describe('times', () => {
    it('multiplies properly', () => {
      const multiplier = BigInt.fromI32(5)
      const usdAmount = USD.fromI32(100)

      const result = usdAmount.times(multiplier)
      expect(result.toString()).toBe('500')
    })

    it('throws an error when using a negative multiplier', () => {
      expect(() => {
        const multiplier = BigInt.fromI32(-5)
        const usdAmount = USD.fromI32(100)

        usdAmount.times(multiplier)
      }).toThrow('USD cannot be negative')
    })
  })

  describe('div', () => {
    it('divides properly', () => {
      const divisor = BigInt.fromI32(4)
      const usdAmount = USD.fromI32(100)

      const result = usdAmount.div(divisor)
      expect(result.toString()).toBe('25')
    })

    it('throws an error when using a negative divisor', () => {
      expect(() => {
        const divisor = BigInt.fromI32(-5)
        const usdAmount = USD.fromI32(100)

        usdAmount.div(divisor)
      }).toThrow('USD cannot be negative')
    })

    it('throws an error when dividing by zero', () => {
      expect(() => {
        const divisor = BigInt.zero()
        const usdAmount = USD.fromI32(100)

        usdAmount.div(divisor)
      }).toThrow('Trying to divide by zero')
    })
  })

  describe('equals', () => {
    it('returns true for the same amount', () => {
      const usdAmount2 = USD.fromI32(10)
      const usdAmount1 = USD.fromI32(10)

      expect(usdAmount1.equals(usdAmount2)).toBe(true)
    })

    it('returns false for different amounts', () => {
      const usdAmount2 = USD.fromI32(10)
      const usdAmount1 = USD.fromI32(20)

      expect(usdAmount1.equals(usdAmount2)).toBe(false)
    })
  })

  describe('notEquals', () => {
    it('returns false for the same amount', () => {
      const usdAmount2 = USD.fromI32(10)
      const usdAmount1 = USD.fromI32(10)

      expect(usdAmount1.notEquals(usdAmount2)).toBe(false)
    })

    it('returns true for different amounts', () => {
      const usdAmount2 = USD.fromI32(10)
      const usdAmount1 = USD.fromI32(20)

      expect(usdAmount1.notEquals(usdAmount2)).toBe(true)
    })
  })

  describe('lt', () => {
    it('returns true when the first amount is less than the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(20)

      expect(usdAmount1.lt(usdAmount2)).toBe(true)
    })

    it('returns false when the first amount is equal to the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.lt(usdAmount2)).toBe(false)
    })

    it('returns false when the first amount is greater than the second', () => {
      const usdAmount1 = USD.fromI32(20)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.lt(usdAmount2)).toBe(false)
    })
  })

  describe('le', () => {
    it('returns true when the first amount is less than the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(20)

      expect(usdAmount1.le(usdAmount2)).toBe(true)
    })

    it('returns true when the first amount is equal to the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.le(usdAmount2)).toBe(true)
    })

    it('returns false when the first amount is greater than the second', () => {
      const usdAmount1 = USD.fromI32(20)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.le(usdAmount2)).toBe(false)
    })
  })

  describe('gt', () => {
    it('returns true when the first amount is greater than the second', () => {
      const usdAmount1 = USD.fromI32(20)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.gt(usdAmount2)).toBe(true)
    })

    it('returns false when the first amount is equal to the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.gt(usdAmount2)).toBe(false)
    })

    it('returns false when the first amount is less than the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(20)

      expect(usdAmount1.gt(usdAmount2)).toBe(false)
    })
  })

  describe('ge', () => {
    it('returns true when the first amount is greater than the second', () => {
      const usdAmount1 = USD.fromI32(20)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.ge(usdAmount2)).toBe(true)
    })

    it('returns true when the first amount is equal to the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(10)

      expect(usdAmount1.ge(usdAmount2)).toBe(true)
    })

    it('returns false when the first amount is less than the second', () => {
      const usdAmount1 = USD.fromI32(10)
      const usdAmount2 = USD.fromI32(20)

      expect(usdAmount1.ge(usdAmount2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('handles zero correctly', () => {
      const usd = USD.zero()

      expect(usd.toString()).toBe('0')
    })

    it('handles small decimals correctly', () => {
      const amount = '123.45'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.toString()).toBe(amount)
    })

    it('handles large decimals correctly', () => {
      const amount = '0.123456789012345678'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.toString()).toBe(amount)
    })

    it('handles small values correctly', () => {
      const amount = '0.000000000000000005'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.toString()).toBe(amount)
    })

    it('handles integers correctly', () => {
      const amount = '5'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.toString()).toBe(amount)
    })

    it('handles large values correctly', () => {
      const amount = '5916498163948619246012640917204971'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.toString()).toBe(amount)
    })

    it('truncates numbers with more than 18 decimals', () => {
      const amount = '0.1234567890123456789'
      const usd = USD.fromStringDecimal(amount)

      expect(usd.toString()).toBe(amount.substring(0, amount.length - 1))
    })
  })

  describe('toTokenAmount', () => {
    describe('when zero', () => {
      it('returns 0', () => {
        const token = randomToken()
        const usdAmount = USD.zero()
        const tokenAmount = usdAmount.toTokenAmount(token)

        expect(tokenAmount.amount.toString()).toBe('0')
      })
    })

    describe('when not zero', () => {
      it('converts correctly for a token with less than standard decimals', () => {
        const price = 2
        const tokenDecimals: u8 = 6
        const token = randomTokenWithPrice(tokenDecimals, price)

        const decimalAmountUsd = 100
        const usdAmount = USD.fromI32(decimalAmountUsd)
        const result = usdAmount.toTokenAmount(token)

        const expectedAmount = BigInt.fromI32(decimalAmountUsd / price)
        expect(result.amount.toString()).toBe(zeroPadded(expectedAmount, tokenDecimals))
      })

      it('converts correctly for a token with standard decimals', () => {
        const price = 5
        const tokenDecimals: u8 = STANDARD_DECIMALS
        const token = randomTokenWithPrice(tokenDecimals, price)

        const decimalAmountUsd = 100
        const usdAmount = USD.fromI32(decimalAmountUsd)
        const result = usdAmount.toTokenAmount(token)

        const expectedAmount = BigInt.fromI32(decimalAmountUsd / price)
        expect(result.amount.toString()).toBe(zeroPadded(expectedAmount, tokenDecimals))
      })

      it('converts correctly for a token with more than standard decimals', () => {
        const price = 20
        const tokenDecimals: u8 = 20
        const token = randomTokenWithPrice(tokenDecimals, price)

        const decimalAmountUsd = 100
        const usdAmount = USD.fromI32(decimalAmountUsd)
        const result = usdAmount.toTokenAmount(token)

        const expectedAmount = BigInt.fromI32(decimalAmountUsd / price)
        expect(result.amount.toString()).toBe(zeroPadded(expectedAmount, tokenDecimals))
      })
    })
  })
})
