import { BigInt } from '../../common'
import { STANDARD_DECIMALS } from '../../constants'
import { USD } from '../../tokens'
import { buildZeroPadding, randomToken, setTokenPrice } from '../helpers'

describe('USD', () => {
  describe('operators', () => {
    describe('when performing arithmetic operations', () => {
      it('adds two USD amounts correctly', () => {
        const amount1 = USD.fromI32(100)
        const amount2 = USD.fromI32(50)
        const result = amount1.plus(amount2)

        expect(result.value.toString()).toBe(USD.fromI32(150).value.toString())
      })

      it('subtracts USD amounts correctly', () => {
        const amount1 = USD.fromI32(100)
        const amount2 = USD.fromI32(30)
        const result = amount1.minus(amount2)

        expect(result.value.toString()).toBe(USD.fromI32(70).value.toString())
      })

      it('multiplies USD amount by BigInt correctly', () => {
        const amount = USD.fromI32(100)
        const multiplier = BigInt.fromI32(3)
        const result = amount.times(multiplier)

        expect(result.value.toString()).toBe(USD.fromI32(300).value.toString())
      })

      it('divides USD amount by BigInt correctly', () => {
        const amount = USD.fromI32(100)
        const divisor = BigInt.fromI32(4)
        const result = amount.div(divisor)

        expect(result.value.toString()).toBe(USD.fromI32(25).value.toString())
      })
    })
  })

  describe('toTokenAmount', () => {
    describe('when converting USD to TokenAmount', () => {
      it('converts USD to TokenAmount correctly based on token price', () => {
        const usdAmount = USD.fromI32(1000)
        const token = randomToken()

        setTokenPrice(token, 2)

        const tokenAmount = usdAmount.toTokenAmount(token)

        // Expected: 1000 USD / $2 per token = 500 tokens
        expect(tokenAmount.amount.toString()).toBe('500' + buildZeroPadding(token.decimals))
        expect(tokenAmount.token.equals(token)).toBe(true)
      })

      it('handles zero USD amount correctly', () => {
        const zeroUsd = USD.zero()
        const token = randomToken()

        const tokenAmount = zeroUsd.toTokenAmount(token)

        expect(tokenAmount.isZero()).toBe(true)
        expect(tokenAmount.token.equals(token)).toBe(true)
      })

      it('handles different token decimals correctly', () => {
        const usdAmount = USD.fromI32(500)
        const tokenDecimals: u8 = 6
        const token = randomToken(tokenDecimals)

        setTokenPrice(token, 10)

        const tokenAmount = usdAmount.toTokenAmount(token)

        // Expected: 500 USD / $10 per token = 50 tokens
        expect(tokenAmount.amount.toString()).toBe('50' + buildZeroPadding(tokenDecimals))
        expect(tokenAmount.token.decimals).toBe(tokenDecimals)
      })
    })
  })

  describe('comparison', () => {
    describe('when comparing USD amounts', () => {
      it('checks equality between USD amounts', () => {
        const amount1 = USD.fromI32(100)
        const amount2 = USD.fromI32(100)
        const amount3 = USD.fromI32(50)

        expect(amount1.value.equals(amount2.value)).toBe(true)
        expect(amount1.value.equals(amount3.value)).toBe(false)
      })

      it('checks if amount is zero', () => {
        const zero = USD.zero()
        const nonZero = USD.fromI32(100)

        expect(zero.value.isZero()).toBe(true)
        expect(nonZero.value.isZero()).toBe(false)
      })
    })
  })

  describe('fromStringDecimal', () => {
    describe('when creating a USD from a decimal string', () => {
      it('correctly scales the amount with standard decimals', () => {
        const amount = '123.45'
        const usd = USD.fromStringDecimal(amount)

        expect(usd.value.toString()).toBe('12345' + buildZeroPadding(STANDARD_DECIMALS - 2))
      })

      it('handles whole numbers correctly', () => {
        const amount = '100'
        const usd = USD.fromStringDecimal(amount)

        expect(usd.value.toString()).toBe('100' + buildZeroPadding(STANDARD_DECIMALS))
      })

      it('handles zero correctly', () => {
        const amount = '0'
        const usd = USD.fromStringDecimal(amount)

        expect(usd.isZero()).toBe(true)
        expect(usd.value.toString()).toBe(amount)
      })

      it('handles large numbers', () => {
        const amount = '1234567.89'
        const usd = USD.fromStringDecimal(amount)

        expect(usd.value.toString()).toBe('123456789' + buildZeroPadding(STANDARD_DECIMALS - 2))
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
  })

  describe('toString', () => {
    describe('when converting a USD to string', () => {
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
})
