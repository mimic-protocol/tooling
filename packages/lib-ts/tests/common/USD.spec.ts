import { USD } from '../../common'
import { STANDARD_DECIMALS } from '../../constants'
import { scale } from '../../helpers'
import { buildZeroPadding, HIGHER_THAN_STANDARD_DECIMALS } from '../helpers'

describe('USD', () => {
  describe('fromDecimal', () => {
    describe('when creating a USD from a decimal string', () => {
      it('correctly scales the amount with standard decimals', () => {
        const decimalAmount = '123.45'
        const usd = USD.fromDecimal(decimalAmount)
        const expected = scale(decimalAmount, STANDARD_DECIMALS)

        expect(usd.value.toString()).toBe(expected.toString())
      })

      it('handles whole numbers correctly', () => {
        const decimalAmount = '100'
        const usd = USD.fromDecimal(decimalAmount)
        const expected = decimalAmount + buildZeroPadding(STANDARD_DECIMALS)

        expect(usd.value.toString()).toBe(expected)
      })

      it('handles zero correctly', () => {
        const decimalAmount = '0'
        const usd = USD.fromDecimal(decimalAmount)

        expect(usd.value.toString()).toBe('0')
        expect(usd.isZero()).toBe(true)
      })

      it('handles large numbers', () => {
        const decimalAmount = '1234567.89'
        const usd = USD.fromDecimal(decimalAmount)
        const expected = scale(decimalAmount, STANDARD_DECIMALS)

        expect(usd.value.toString()).toBe(expected.toString())
      })

      it('handles small decimal fractions', () => {
        const decimalAmount = '0.' + buildZeroPadding(5) + '1'
        const usd = USD.fromDecimal(decimalAmount)
        const expected = scale(decimalAmount, STANDARD_DECIMALS)

        expect(usd.value.toString()).toBe(expected.toString())
      })

      it('throws an error when amount has multiple decimal points', () => {
        expect(() => {
          const invalidAmount = '100.45.67'
          USD.fromDecimal(invalidAmount)
        }).toThrow()
      })
    })
  })

  describe('toDecimal', () => {
    describe('when converting a USD to a decimal string', () => {
      it('returns the correct decimal representation with default precision', () => {
        const decimalAmount = '123.45'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toDecimal()).toBe(decimalAmount + buildZeroPadding(STANDARD_DECIMALS - 2))
      })

      it('handles zero correctly', () => {
        const usd = USD.zero()

        expect(usd.toDecimal()).toBe('0')
      })

      it('respects custom precision', () => {
        const decimalAmount = '0.123456789012345678'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toDecimal(2)).toBe('0.12')
        expect(usd.toDecimal(5)).toBe('0.12345')
        expect(usd.toDecimal(10)).toBe('0.1234567890')
      })

      it('handles whole numbers correctly', () => {
        const decimalAmount = '5'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toDecimal()).toBe(decimalAmount + '.' + buildZeroPadding(STANDARD_DECIMALS))
      })

      it('ensures string conversion matches toDecimal', () => {
        const decimalAmount = '123.45'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toString()).toBe(usd.toDecimal())
      })

      it('handles large numbers correctly', () => {
        const decimalAmount = '1234567.89'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toDecimal()).toBe(decimalAmount + buildZeroPadding(STANDARD_DECIMALS - 2))
      })

      it('works with higher than standard decimals precision', () => {
        const decimalAmount = '0.123456789012345678'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toDecimal(HIGHER_THAN_STANDARD_DECIMALS)).toBe(decimalAmount)
      })

      it('handles very small values correctly', () => {
        const decimalAmount = '0.' + buildZeroPadding(STANDARD_DECIMALS - 1) + '5'
        const scaledAmount = scale(decimalAmount, STANDARD_DECIMALS)
        const usd = new USD(scaledAmount)

        expect(usd.toDecimal()).toBe(decimalAmount)
      })
    })
  })
})
