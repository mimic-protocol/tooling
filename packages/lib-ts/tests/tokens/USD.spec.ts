import { USD } from '../../tokens'

describe('USD', () => {
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
})
