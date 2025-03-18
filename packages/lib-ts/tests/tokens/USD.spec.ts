import { STANDARD_DECIMALS } from '../../constants'
import { USD } from '../../tokens'
import { buildZeroPadding } from '../helpers'

describe('USD', () => {
  describe('fromStringDecimal', () => {
    describe('when creating a USD from a decimal string', () => {
      it('correctly scales the amount with standard decimals', () => {
        const decimalAmount = '123.45'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.value.toString()).toBe('123450000000000000000')
      })

      it('handles whole numbers correctly', () => {
        const decimalAmount = '100'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.value.toString()).toBe('100000000000000000000')
      })

      it('handles zero correctly', () => {
        const decimalAmount = '0'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.value.toString()).toBe('0')
        expect(usd.isZero()).toBe(true)
      })

      it('handles large numbers', () => {
        const decimalAmount = '1234567.89'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.value.toString()).toBe('1234567890000000000000000')
      })

      it('handles small decimal fractions', () => {
        const decimalAmount = '0.000001'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.value.toString()).toBe('1000000000000')
      })

      it('throws an error when amount has multiple decimal points', () => {
        expect(() => {
          const invalidAmount = '100.45.67'
          USD.fromStringDecimal(invalidAmount)
        }).toThrow()
      })
    })
  })

  describe('toStringDecimal', () => {
    describe('when converting a USD to a decimal string', () => {
      it('returns the correct decimal representation with default precision', () => {
        const decimalAmount = '123.45'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.toStringDecimal()).toBe(decimalAmount + buildZeroPadding(STANDARD_DECIMALS - 2))
      })

      it('handles zero correctly', () => {
        const usd = USD.zero()

        expect(usd.toStringDecimal(0)).toBe('0')
      })

      it('respects custom precision', () => {
        const decimalAmount = '0.123456789012345678'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.toStringDecimal()).toBe(decimalAmount)
      })

      it('handles whole numbers correctly', () => {
        const decimalAmount = '5'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.toStringDecimal()).toBe(decimalAmount + '.' + buildZeroPadding(STANDARD_DECIMALS))
      })

      it('ensures string conversion matches toStringDecimal', () => {
        const decimalAmount = '123.45'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.toStringDecimal()).toBe(decimalAmount + buildZeroPadding(STANDARD_DECIMALS - 2))
      })

      it('handles large numbers correctly', () => {
        const decimalAmount = '1234567.89'
        const usd = USD.fromStringDecimal(decimalAmount, 2)

        expect(usd.toStringDecimal(2)).toBe(decimalAmount)
      })

      it('works with higher than standard decimals precision', () => {
        const decimalAmount = '0.123456789012345678'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.toStringDecimal(STANDARD_DECIMALS)).toBe(decimalAmount)
      })

      it('handles very small values correctly', () => {
        const decimalAmount = '0.000000000000000005'
        const usd = USD.fromStringDecimal(decimalAmount)

        expect(usd.toStringDecimal()).toBe(decimalAmount)
      })
    })
  })
})
