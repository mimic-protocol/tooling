import { STANDARD_DECIMALS } from '../../src/helpers'
import { DenominationToken, TokenAmount } from '../../src/tokens'
import { BigInt } from '../../src/types'
import { randomERC20Token, randomERC20TokenWithPrice, randomEvmAddress } from '../helpers'

describe('TokenAmount', () => {
  describe('fromI32', () => {
    it('creates using integers properly', () => {
      const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 100)
      expect(tokenAmount.toString()).toBe('100 ' + tokenAmount.symbol)
    })

    it('throws an error when creating with a negative amount', () => {
      expect(() => {
        TokenAmount.fromI32(randomERC20Token(), -10)
      }).toThrow('Token amount cannot be negative')
    })
  })

  describe('fromStringDecimal', () => {
    it('correctly scales the amount with standard decimals', () => {
      const amount = '123.45'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.amount.toString()).toBe('123450000000000000000')
    })

    it('handles whole numbers correctly', () => {
      const amount = '100'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.amount.toString()).toBe('100000000000000000000')
    })

    it('handles zero correctly', () => {
      const amount = '0'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.amount.toString()).toBe('0')
      expect(tokenAmount.isZero()).toBe(true)
    })

    it('handles large numbers', () => {
      const amount = '1234567.89'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.amount.toString()).toBe('1234567890000000000000000')
    })

    it('handles small decimal fractions', () => {
      const amount = '0.000001'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.amount.toString()).toBe('1000000000000')
    })

    it('throws an error when amount has multiple decimal points', () => {
      expect(() => {
        const invalidAmount = '100.45.67'
        TokenAmount.fromStringDecimal(randomERC20Token(), invalidAmount)
      }).toThrow()
    })

    it('throws an error when creating a token amount with more decimals than the requested precision', () => {
      expect(() => {
        const amount = '0.1234567890123456789'
        TokenAmount.fromStringDecimal(randomERC20Token(), amount)
      }).toThrow('Too many decimal places. Max allowed: 18, found: 19')
    })
  })

  describe('fromBigInt', () => {
    it('creates a clone of the amount to prevent mutation', () => {
      const token = randomERC20Token()
      const originalAmount = BigInt.fromI32(100)

      const tokenAmount = TokenAmount.fromBigInt(token, originalAmount)
      const modifiedAmount = tokenAmount.amount
      modifiedAmount[0] = 2

      expect(tokenAmount.amount.equals(originalAmount)).toBe(true)
      expect(tokenAmount.amount.equals(modifiedAmount)).toBe(false)
    })
  })

  describe('isZero', () => {
    it('returns true when amount is zero', () => {
      const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 0)
      expect(tokenAmount.isZero()).toBe(true)
    })

    it('returns false when amount is not zero', () => {
      const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 100)
      expect(tokenAmount.isZero()).toBe(false)
    })
  })

  describe('plus', () => {
    it('adds two token amounts of the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 50)

      const result = tokenAmount1.plus(tokenAmount2)
      expect(result.toString()).toBe('150 ' + token.symbol)
      expect(result.token.equals(token)).toBe(true)
    })

    it('throws an error when adding tokens of different types', () => {
      expect(() => {
        const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
        const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 50)

        tokenAmount1.plus(tokenAmount2)
      }).toThrow('Cannot add different tokens')
    })
  })

  describe('minus', () => {
    it('subtracts two token amounts of the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 50)

      const result = tokenAmount1.minus(tokenAmount2)
      expect(result.toString()).toBe('50 ' + token.symbol)
      expect(result.token.equals(token)).toBe(true)
    })

    it('throws an error when subtracting tokens of different types', () => {
      expect(() => {
        const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
        const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 50)

        tokenAmount1.minus(tokenAmount2)
      }).toThrow('Cannot subtract different tokens')
    })

    it('throws an error when the result is negative', () => {
      expect(() => {
        const token = randomERC20Token()
        const tokenAmount1 = TokenAmount.fromI32(token, 100)
        const tokenAmount2 = TokenAmount.fromI32(token, 500)

        tokenAmount1.minus(tokenAmount2)
      }).toThrow('Token amount cannot be negative')
    })
  })

  describe('times', () => {
    it('multiplies a token amount by a decimal value', () => {
      const multiplier = BigInt.fromI32(5)
      const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 10)

      const result = tokenAmount.times(multiplier)
      expect(result.toString()).toBe('50 ' + tokenAmount.symbol)
      expect(result.token.equals(tokenAmount.token)).toBe(true)
    })

    it('throws an error when using a negative multiplier', () => {
      expect(() => {
        const multiplier = BigInt.fromI32(-5)
        const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 10)

        tokenAmount.times(multiplier)
      }).toThrow('Token amount cannot be negative')
    })
  })

  describe('div', () => {
    it('divides a token amount by a decimal value', () => {
      const divisor = BigInt.fromI32(4)
      const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 100)

      const result = tokenAmount.div(divisor)
      expect(result.toString()).toBe('25 ' + tokenAmount.symbol)
      expect(result.token.equals(tokenAmount.token)).toBe(true)
    })

    it('throws an error using a negative divisor', () => {
      expect(() => {
        const divisor = BigInt.fromI32(-5)
        const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 10)

        tokenAmount.div(divisor)
      }).toThrow('Token amount cannot be negative')
    })

    it('throws an error when dividing by zero', () => {
      expect(() => {
        const divisor = BigInt.zero()
        const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 10)

        tokenAmount.div(divisor)
      }).toThrow('Trying to divide by zero')
    })
  })

  describe('equals', () => {
    it('returns true for token amounts with the same token and amount', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.equals(tokenAmount2)).toBe(true)
    })

    it('returns false for same tokens with different amounts', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 200)

      expect(tokenAmount1.equals(tokenAmount2)).toBe(false)
    })

    it('returns false for different tokens', () => {
      const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
      const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 100)

      expect(tokenAmount1.equals(tokenAmount2)).toBe(false)
    })
  })

  describe('notEquals', () => {
    it('returns false for token amounts with the same token and amount', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.notEquals(tokenAmount2)).toBe(false)
    })

    it('returns true for same tokens with different amounts', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 200)

      expect(tokenAmount1.notEquals(tokenAmount2)).toBe(true)
    })

    it('returns true for different tokens', () => {
      const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
      const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 100)

      expect(tokenAmount1.notEquals(tokenAmount2)).toBe(true)
    })
  })

  describe('lt', () => {
    it('returns true when the first amount is less than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 200)

      expect(tokenAmount1.lt(tokenAmount2)).toBe(true)
    })

    it('returns false when the first amount is equal to the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.lt(tokenAmount2)).toBe(false)
    })

    it('returns false when the first amount is greater than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 200)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.lt(tokenAmount2)).toBe(false)
    })

    it('throws when comparing amounts of different tokens', () => {
      expect(() => {
        const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
        const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 200)

        tokenAmount1.lt(tokenAmount2)
      }).toThrow()
    })
  })

  describe('le', () => {
    it('returns true when the first amount is less than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 200)

      expect(tokenAmount1.le(tokenAmount2)).toBe(true)
    })

    it('returns true when the first amount is equal to the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.le(tokenAmount2)).toBe(true)
    })

    it('returns false when the first amount is greater than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 200)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.le(tokenAmount2)).toBe(false)
    })

    it('throws when comparing amounts of different tokens', () => {
      expect(() => {
        const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
        const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 200)

        tokenAmount1.le(tokenAmount2)
      }).toThrow()
    })
  })

  describe('gt', () => {
    it('returns true when the first amount is greater than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 200)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.gt(tokenAmount2)).toBe(true)
    })

    it('returns false when the first amount is equal to the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.gt(tokenAmount2)).toBe(false)
    })

    it('returns false when the first amount is less than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 200)

      expect(tokenAmount1.gt(tokenAmount2)).toBe(false)
    })

    it('throws when comparing amounts of different tokens', () => {
      expect(() => {
        const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
        const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 200)

        tokenAmount1.gt(tokenAmount2)
      }).toThrow()
    })
  })

  describe('ge', () => {
    it('returns true when the first amount is greater than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 200)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.ge(tokenAmount2)).toBe(true)
    })

    it('returns true when the first amount is equal to the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 100)

      expect(tokenAmount1.ge(tokenAmount2)).toBe(true)
    })

    it('returns false when the first amount is less than the second for the same token', () => {
      const token = randomERC20Token()
      const tokenAmount1 = TokenAmount.fromI32(token, 100)
      const tokenAmount2 = TokenAmount.fromI32(token, 200)

      expect(tokenAmount1.ge(tokenAmount2)).toBe(false)
    })

    it('throws when comparing amounts of different tokens', () => {
      expect(() => {
        const tokenAmount1 = TokenAmount.fromI32(randomERC20Token(), 100)
        const tokenAmount2 = TokenAmount.fromI32(randomERC20Token(), 200)

        tokenAmount1.ge(tokenAmount2)
      }).toThrow()
    })
  })

  describe('toString', () => {
    it('handles zero correctly', () => {
      const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 0)

      expect(tokenAmount.toString()).toBe('0 ' + tokenAmount.symbol)
    })

    it('handles small decimals correctly', () => {
      const amount = '123.45'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.toString()).toBe(amount + ' ' + tokenAmount.symbol)
    })

    it('handles large decimals correctly', () => {
      const amount = '0.123456789012345678'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.toString()).toBe(amount + ' ' + tokenAmount.symbol)
    })

    it('handles small values correctly', () => {
      const amount = '0.000000000000000005'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.toString()).toBe(amount + ' ' + tokenAmount.symbol)
    })

    it('handles integers correctly', () => {
      const amount = '5'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.toString()).toBe(amount + ' ' + tokenAmount.symbol)
    })

    it('handles large values correctly', () => {
      const amount = '5916498163948619246012640917204971'
      const tokenAmount = TokenAmount.fromStringDecimal(randomERC20Token(), amount)

      expect(tokenAmount.toString()).toBe(amount + ' ' + tokenAmount.symbol)
    })
  })

  describe('toUsd', () => {
    describe('for ERC20 tokens', () => {
      describe('when zero', () => {
        it('returns 0', () => {
          const tokenAmount = TokenAmount.fromI32(randomERC20Token(), 0)
          const result = tokenAmount.toUsd()
          expect(result.toString()).toBe('0')
        })
      })

      describe('when not zero', () => {
        it('converts correctly for a token with less than standard decimals', () => {
          const price = 2
          const tokenDecimals: u8 = 6
          const token = randomERC20TokenWithPrice(tokenDecimals, price)

          const decimalTokenAmount = 100
          const tokenAmount = TokenAmount.fromI32(token, decimalTokenAmount)

          const result = tokenAmount.toUsd()
          const expectedAmount = decimalTokenAmount * price
          expect(result.toString()).toBe(expectedAmount.toString())
        })

        it('converts correctly for a token with standard decimals', () => {
          const price = 5
          const tokenDecimals: u8 = STANDARD_DECIMALS
          const token = randomERC20TokenWithPrice(tokenDecimals, price)

          const decimalTokenAmount = 100
          const tokenAmount = TokenAmount.fromI32(token, decimalTokenAmount)

          const result = tokenAmount.toUsd()
          const expectedAmount = decimalTokenAmount * price
          expect(result.toString()).toBe(expectedAmount.toString())
        })

        it('converts correctly for a token with more than standard decimals', () => {
          const price = 20
          const tokenDecimals: u8 = 20
          const token = randomERC20TokenWithPrice(tokenDecimals, price)

          const decimalTokenAmount = 100
          const tokenAmount = TokenAmount.fromI32(token, decimalTokenAmount)

          const result = tokenAmount.toUsd()
          const expectedAmount = decimalTokenAmount * price
          expect(result.toString()).toBe(expectedAmount.toString())
        })
      })
    })

    describe('for USD denomination', () => {
      describe('when zero', () => {
        it('returns 0', () => {
          const tokenAmount = TokenAmount.fromI32(DenominationToken.USD(), 0)
          const result = tokenAmount.toUsd()
          expect(result.toString()).toBe('0')
        })
      })

      describe('when not zero', () => {
        it('converts with price 1', () => {
          const decimalTokenAmount = 100
          const tokenAmount = TokenAmount.fromI32(DenominationToken.USD(), decimalTokenAmount)

          const result = tokenAmount.toUsd()
          expect(result.toString()).toBe(decimalTokenAmount.toString())
        })
      })
    })

    describe('for another denomination token', () => {
      describe('when zero', () => {
        it('returns 0', () => {
          const tokenAmount = TokenAmount.fromI32(DenominationToken.USD(), 0)
          const result = tokenAmount.toUsd()
          expect(result.toString()).toBe('0')
        })
      })

      describe('when not zero', () => {
        it('throws', () => {
          expect(() => {
            const decimalTokenAmount = 100
            const token = new DenominationToken(randomEvmAddress(), 18, 'EUR')
            const tokenAmount = TokenAmount.fromI32(token, decimalTokenAmount)
            tokenAmount.toUsd()
          }).toThrow('Price query not supported for token')
        })
      })
    })
  })

  describe('fromSlippageBps', () => {
    it('applies 0.5% (50 bps) correctly', () => {
      const token = randomERC20Token()
      const amountOut = TokenAmount.fromI32(token, 1000)
      const result = TokenAmount.fromSlippageBps(amountOut, 50)
      expect(result.toString()).toBe('995 ' + token.symbol)
    })

    it('applies 0% (0 bps) as identity', () => {
      const token = randomERC20Token()
      const amountOut = TokenAmount.fromI32(token, 1234)
      const result = TokenAmount.fromSlippageBps(amountOut, 0)
      expect(result.toString()).toBe('1234 ' + token.symbol)
    })

    it('applies 100% (10000 bps) to zero', () => {
      const token = randomERC20Token()
      const amountOut = TokenAmount.fromI32(token, 999)
      const result = TokenAmount.fromSlippageBps(amountOut, 10000)
      expect(result.toString()).toBe('0 ' + token.symbol)
    })

    it('throws for negative bps', () => {
      expect(() => {
        const token = randomERC20Token()
        const amountOut = TokenAmount.fromI32(token, 100)
        TokenAmount.fromSlippageBps(amountOut, -1)
      }).toThrow('Slippage bps must be between 0 and 10000')
    })

    it('throws for bps greater than 10000', () => {
      expect(() => {
        const token = randomERC20Token()
        const amountOut = TokenAmount.fromI32(token, 100)
        TokenAmount.fromSlippageBps(amountOut, 10001)
      }).toThrow('Slippage bps must be between 0 and 10000')
    })
  })

  describe('fromSlippagePercentage', () => {
    it('applies 0.5% correctly from string', () => {
      const token = randomERC20Token()
      const amountOut = TokenAmount.fromI32(token, 1000)
      const result = TokenAmount.fromSlippagePercentage(amountOut, '0.5')
      expect(result.toString()).toBe('995 ' + token.symbol)
    })

    it('applies 0% correctly from string', () => {
      const token = randomERC20Token()
      const amountOut = TokenAmount.fromI32(token, 777)
      const result = TokenAmount.fromSlippagePercentage(amountOut, '0')
      expect(result.toString()).toBe('777 ' + token.symbol)
    })

    it('applies 100% correctly from string', () => {
      const token = randomERC20Token()
      const amountOut = TokenAmount.fromI32(token, 555)
      const result = TokenAmount.fromSlippagePercentage(amountOut, '100')
      expect(result.toString()).toBe('0 ' + token.symbol)
    })

    it('throws for negative percentage string', () => {
      expect(() => {
        const token = randomERC20Token()
        const amountOut = TokenAmount.fromI32(token, 100)
        TokenAmount.fromSlippagePercentage(amountOut, '-1')
      }).toThrow('Slippage percent must be between 0 and 100')
    })

    it('throws for percent bigger than 100', () => {
      expect(() => {
        const token = randomERC20Token()
        const amountOut = TokenAmount.fromI32(token, 100)
        TokenAmount.fromSlippagePercentage(amountOut, '100.01')
      }).toThrow('Slippage percent must be between 0 and 100')
    })

    it('throws for values with more than 2 decimal places', () => {
      expect(() => {
        const token = randomERC20Token()
        const amountOut = TokenAmount.fromI32(token, 100)
        TokenAmount.fromSlippagePercentage(amountOut, '0.123456')
      }).toThrow('Too many decimal places. Max allowed: 2, found: 6')
    })

    it('throws for malformed string', () => {
      expect(() => {
        const token = randomERC20Token()
        const amountOut = TokenAmount.fromI32(token, 100)
        TokenAmount.fromSlippagePercentage(amountOut, '1.2.3')
      }).toThrow()
    })
  })
})
