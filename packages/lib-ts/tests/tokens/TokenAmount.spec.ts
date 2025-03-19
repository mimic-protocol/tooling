import { BigInt } from '../../common'
import { Token, TokenAmount, USD } from '../../tokens'
import { buildZeroPadding, randomAddress, randomToken, setTokenPrice } from '../helpers'

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
      const amount1 = 100
      const amount2 = 50

      const tokenAmount1 = TokenAmount.fromI32(token, amount1)
      const tokenAmount2 = TokenAmount.fromI32(token, amount2)

      const result = tokenAmount1.plus(tokenAmount2)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe((amount1 + amount2).toString() + buildZeroPadding(token.decimals))
    })

    it('throws an error when adding tokens of different types', () => {
      expect(() => {
        const token1 = randomToken()
        const token2 = new Token('OTHER', randomAddress(), 1, 18)
        const amount1 = 100
        const amount2 = 50

        const tokenAmount1 = TokenAmount.fromI32(token1, amount1)
        const tokenAmount2 = TokenAmount.fromI32(token2, amount2)

        tokenAmount1.plus(tokenAmount2)
      }).toThrow()
    })

    it('subtracts two token amounts of the same token', () => {
      const token = randomToken()
      const amount1 = 100
      const amount2 = 30

      const tokenAmount1 = TokenAmount.fromI32(token, amount1)
      const tokenAmount2 = TokenAmount.fromI32(token, amount2)

      const result = tokenAmount1.minus(tokenAmount2)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe((amount1 - amount2).toString() + buildZeroPadding(token.decimals))
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

    it('multiplies a token amount by an integer value', () => {
      const token = randomToken()
      const multiplyValue = 5

      const tokenAmount = TokenAmount.fromI32(token, 10)

      const result = tokenAmount.times(multiplyValue)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe('50' + buildZeroPadding(token.decimals))
    })

    it('throws an error when multiplying by a negative integer value', () => {
      expect(() => {
        const token = randomToken()
        const multiplyValue = -3

        const tokenAmount = TokenAmount.fromI32(token, 10)
        tokenAmount.times(multiplyValue)
      }).toThrow()
    })

    it('divides a token amount by an integer value', () => {
      const token = randomToken()
      const divValue = 4

      const tokenAmount = TokenAmount.fromI32(token, 100)

      const result = tokenAmount.div(divValue)

      expect(result.token.equals(token)).toBe(true)
      expect(result.amount.toString()).toBe('25' + buildZeroPadding(token.decimals))
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
        const token2 = randomToken()
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

  describe('when creating with static factory methods', () => {
    it('creates a TokenAmount from i32 with fromI32', () => {
      const token = randomToken()
      const amount = 100

      const tokenAmount = TokenAmount.fromI32(token, amount)

      expect(tokenAmount.token.equals(token)).toBe(true)
      expect(tokenAmount.amount.toString()).toBe('100' + buildZeroPadding(token.decimals))
    })

    it('creates a TokenAmount from string decimal with fromStringDecimal', () => {
      const token = randomToken()
      const decimalAmount = '100.5'

      const tokenAmount = TokenAmount.fromStringDecimal(token, decimalAmount)

      expect(tokenAmount.token.equals(token)).toBe(true)
      expect(tokenAmount.amount.toString()).toBe('1005' + buildZeroPadding(token.decimals - 1))
    })

    it('creates a TokenAmount from BigInt with fromBigInt', () => {
      const token = randomToken()
      const amount = BigInt.fromI32(100)

      const tokenAmount = TokenAmount.fromBigInt(token, amount)

      expect(tokenAmount.token.equals(token)).toBe(true)
      expect(tokenAmount.amount.equals(amount)).toBe(true)
    })
  })

  describe('when converting token amounts', () => {
    describe('when converting to USD', () => {
      it('converts TokenAmount to USD correctly based on token price', () => {
        const token = randomToken()
        const amount = TokenAmount.fromI32(token, 500)

        setTokenPrice(token, 2)

        const usdAmount = amount.toUsd()

        // Expected: 500 tokens * $2 per token = $1000 USD
        expect(usdAmount.value.toString()).toBe(USD.fromI32(1000).value.toString())
      })

      it('handles zero token amount correctly', () => {
        const token = randomToken()
        const zeroAmount = TokenAmount.fromI32(token, 0)

        const usdAmount = zeroAmount.toUsd()

        expect(usdAmount.isZero()).toBe(true)
      })

      it('handles tokens with different decimals correctly', () => {
        const tokenDecimals: u8 = 6
        const token = randomToken(tokenDecimals)
        const amount = TokenAmount.fromI32(token, 50)

        setTokenPrice(token, 10)

        const usdAmount = amount.toUsd()

        // Expected: 50 tokens * $10 per token = $500 USD
        expect(usdAmount.value.toString()).toBe(USD.fromI32(500).value.toString())
      })
    })

    describe('when converting to another token', () => {
      it('converts TokenAmount to another token correctly based on price ratio', () => {
        const token1 = randomToken()
        const token2 = randomToken()
        const amount = TokenAmount.fromI32(token1, 100)

        setTokenPrice(token1, 2)
        setTokenPrice(token2, 4)

        const convertedAmount = amount.toTokenAmount(token2)

        // Expected: 100 token1 * ($2/$4) = 50 token2
        expect(convertedAmount.amount.toString()).toBe('50' + buildZeroPadding(token2.decimals))
        expect(convertedAmount.token.equals(token2)).toBe(true)
      })

      it('handles zero token amount correctly', () => {
        const token1 = randomToken()
        const token2 = randomToken()
        const zeroAmount = TokenAmount.fromI32(token1, 0)

        const convertedAmount = zeroAmount.toTokenAmount(token2)

        expect(convertedAmount.isZero()).toBe(true)
        expect(convertedAmount.token.equals(token2)).toBe(true)
      })

      it('handles tokens with different decimals correctly', () => {
        const token1 = randomToken(6)
        const token2 = randomToken(18)
        const amount = TokenAmount.fromI32(token1, 200)

        setTokenPrice(token1, 10)
        setTokenPrice(token2, 5)

        const convertedAmount = amount.toTokenAmount(token2)

        // Expected: 200 token1 * ($10/$5) = 400 token2
        expect(convertedAmount.amount.toString()).toBe('400' + buildZeroPadding(token2.decimals))
        expect(convertedAmount.token.decimals).toBe(token2.decimals)
      })

      it('handles conversion to the same token type', () => {
        const token = randomToken()
        const amount = TokenAmount.fromI32(token, 100)

        const convertedAmount = amount.toTokenAmount(token)

        expect(convertedAmount.amount.equals(amount.amount)).toBe(true)
        expect(convertedAmount.token.equals(token)).toBe(true)
        expect(convertedAmount.equals(amount)).toBe(true)
      })
    })
  })
})
