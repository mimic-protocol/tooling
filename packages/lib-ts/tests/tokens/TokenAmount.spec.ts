import { BigInt } from '../../common'
import { Token, TokenAmount } from '../../tokens'
import { randomAddress, randomToken } from '../helpers'

describe('TokenAmount', () => {
  describe('when creating a token amount', () => {
    it('creates a clone of the amount to prevent mutation', () => {
      const token = randomToken()
      const originalAmount = BigInt.fromI32(100)

      const tokenAmount = new TokenAmount(token, originalAmount)
      const modifiedAmount = tokenAmount.amount
      modifiedAmount[0] = 2

      expect(tokenAmount.amount.equals(originalAmount)).toBe(true)
      expect(tokenAmount.amount.equals(modifiedAmount)).toBe(false)
    })

    it('throws an error when creating with a negative amount', () => {
      expect(() => {
        const token = randomToken()
        const negativeAmount = BigInt.fromI32(-10)
        new TokenAmount(token, negativeAmount)
      }).toThrow()
    })
  })

  describe('when using arithmetic operations', () => {
    it('adds two token amounts of the same token', () => {
      const token = randomToken()
      const amount1 = BigInt.fromI32(100)
      const amount2 = BigInt.fromI32(50)

      const tokenAmount1 = new TokenAmount(token, amount1)
      const tokenAmount2 = new TokenAmount(token, amount2)

      const result = tokenAmount1.plus(tokenAmount2)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.equals(BigInt.fromI32(150))).toBe(true)
    })

    it('throws an error when adding tokens of different types', () => {
      expect(() => {
        const token1 = randomToken()
        const token2 = new Token('OTHER', randomAddress(), 1, 18)
        const amount1 = BigInt.fromI32(100)
        const amount2 = BigInt.fromI32(50)

        const tokenAmount1 = new TokenAmount(token1, amount1)
        const tokenAmount2 = new TokenAmount(token2, amount2)

        tokenAmount1.plus(tokenAmount2)
      }).toThrow()
    })

    it('subtracts two token amounts of the same token', () => {
      const token = randomToken()
      const amount1 = BigInt.fromI32(100)
      const amount2 = BigInt.fromI32(30)

      const tokenAmount1 = new TokenAmount(token, amount1)
      const tokenAmount2 = new TokenAmount(token, amount2)

      const result = tokenAmount1.minus(tokenAmount2)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.equals(BigInt.fromI32(70))).toBe(true)
    })

    it('throws an error when subtracting tokens of different types', () => {
      expect(() => {
        const token1 = randomToken()
        const token2 = new Token('OTHER', randomAddress(), 1, 18)
        const amount1 = BigInt.fromI32(100)
        const amount2 = BigInt.fromI32(50)

        const tokenAmount1 = new TokenAmount(token1, amount1)
        const tokenAmount2 = new TokenAmount(token2, amount2)

        tokenAmount1.minus(tokenAmount2)
      }).toThrow()
    })

    it('multiplies a token amount by a decimal value', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(10)
      const multiplyValue = 5

      const tokenAmount = new TokenAmount(token, amount)

      const result = tokenAmount.times(multiplyValue)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe('50')
    })

    it('multiplies a token amount by a decimal with fractional part', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(10)
      const multiplyValue = 2

      const tokenAmount = new TokenAmount(token, amount)

      const result = tokenAmount.times(multiplyValue)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe('20')
    })

    it('throws an error when multiplying by a negative decimal value', () => {
      expect(() => {
        const token = randomToken()
        const amount = BigInt.fromI32(10)
        const multiplyValue = -3

        const tokenAmount = new TokenAmount(token, amount)
        tokenAmount.times(multiplyValue)
      }).toThrow()
    })

    it('divides a token amount by a decimal value', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(100)
      const divValue = 4

      const tokenAmount = new TokenAmount(token, amount)

      const result = tokenAmount.div(divValue)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe('25')
    })

    it('throws an error when dividing by a negative decimal value', () => {
      expect(() => {
        const token = randomToken()
        const amount = BigInt.fromI32(100)
        const divValue = -4

        const tokenAmount = new TokenAmount(token, amount)
        tokenAmount.div(divValue)
      }).toThrow()
    })

    it('throws an error when dividing by zero', () => {
      expect(() => {
        const token = randomToken()
        const amount = BigInt.fromI32(100)
        const divValue = 0

        const tokenAmount = new TokenAmount(token, amount)
        tokenAmount.div(divValue)
      }).toThrow()
    })
  })

  describe('when comparing token amounts', () => {
    it('returns true for token amounts with the same token and amount', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(100)

      const tokenAmount1 = new TokenAmount(token, amount)
      const tokenAmount2 = new TokenAmount(token, amount)

      expect(tokenAmount1.equals(tokenAmount2)).toBe(true)
    })

    it('throws an error when comparing tokens of different types', () => {
      expect(() => {
        const token1 = randomToken()
        const token2 = new Token('OTHER', randomAddress(), 1, 18)
        const amount = BigInt.fromI32(100)

        const tokenAmount1 = new TokenAmount(token1, amount)
        const tokenAmount2 = new TokenAmount(token2, amount)

        tokenAmount1.equals(tokenAmount2)
      }).toThrow()
    })

    it('returns false for token amounts with different amounts', () => {
      const token = randomToken()
      const amount1 = BigInt.fromI32(100)
      const amount2 = BigInt.fromI32(200)

      const tokenAmount1 = new TokenAmount(token, amount1)
      const tokenAmount2 = new TokenAmount(token, amount2)

      expect(tokenAmount1.equals(tokenAmount2)).toBe(false)
    })

    it('returns true when amount is zero', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(0)

      const tokenAmount = new TokenAmount(token, amount)

      expect(tokenAmount.isZero()).toBe(true)
    })

    it('returns false when amount is not zero', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(100)

      const tokenAmount = new TokenAmount(token, amount)

      expect(tokenAmount.isZero()).toBe(false)
    })
  })
})
