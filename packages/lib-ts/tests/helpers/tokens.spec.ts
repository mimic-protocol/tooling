import { BigInt } from '../../common'
import { STANDARD_DECIMALS } from '../../constants'
import {
  convertAmountBetweenTokens,
  convertTokenAmountToUsd,
  convertUsdToTokenAmount,
  scaleDecimal,
} from '../../helpers'
import { buildZeroPadding, randomToken, randomTokenWithPrice } from '../helpers'

const LOWER_THAN_STANDARD_DECIMALS: u8 = STANDARD_DECIMALS - 12
const HIGHER_THAN_STANDARD_DECIMALS: u8 = STANDARD_DECIMALS + 12

describe('scaleDecimal', () => {
  describe('when converting zero', () => {
    it('returns zero', () => {
      const mockToken = randomToken()
      const result = scaleDecimal('0', mockToken.decimals)

      expect(result.toString()).toBe('0')
    })
  })

  describe('when converting whole numbers', () => {
    it('converts correctly for token with less than standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const result = scaleDecimal(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount + buildZeroPadding(mockToken.decimals))
    })

    it('converts correctly for token with standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const result = scaleDecimal(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount + buildZeroPadding(mockToken.decimals))
    })

    it('converts correctly for token with more than standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const result = scaleDecimal(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount + buildZeroPadding(mockToken.decimals))
    })
  })

  describe('when converting decimal numbers', () => {
    it('handles decimals correctly for token with less than standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const result = scaleDecimal(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount.replace('.', '') + buildZeroPadding(mockToken.decimals - 1))
    })

    it('handles decimals correctly for token with standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const result = scaleDecimal(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount.replace('.', '') + buildZeroPadding(mockToken.decimals - 1))
    })

    it('handles decimals correctly for token with more than standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const result = scaleDecimal(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount.replace('.', '') + buildZeroPadding(mockToken.decimals - 1))
    })
  })

  describe('when handling invalid inputs', () => {
    it('throws an error when amount has multiple decimal points', () => {
      expect(() => {
        const invalidAmount = '100.45.67'
        const mockToken = randomToken()
        scaleDecimal(invalidAmount, mockToken.decimals)
      }).toThrow()
    })

    it('throws an error when amount has non-numeric characters', () => {
      expect(() => {
        const invalidAmount = '100a02'
        const mockToken = randomToken()
        scaleDecimal(invalidAmount, mockToken.decimals)
      }).toThrow()

      expect(() => {
        const invalidAmount = '10.0a02'
        const mockToken = randomToken()
        scaleDecimal(invalidAmount, mockToken.decimals)
      }).toThrow()
    })
  })
})

describe('convertUsdToTokenAmount', () => {
  describe('when usdAmount is zero', () => {
    it('returns 0 with correct decimals', () => {
      const mockToken = randomToken()
      const usdAmount = new BigInt(0)
      const result = convertUsdToTokenAmount(mockToken, usdAmount)

      expect(result.toString()).toBe('0')
      expect(result.length).toBe(mockToken.decimals)
    })
  })

  describe('when token has different prices', () => {
    it('converts correctly for a token with less than standard decimals', () => {
      const price = 2
      const decimalUsdAmount = 100
      const tokenWithCustomPrice = randomTokenWithPrice(LOWER_THAN_STANDARD_DECIMALS, price)
      const usdAmount = scaleDecimal(decimalUsdAmount.toString(), STANDARD_DECIMALS)

      const result = convertUsdToTokenAmount(tokenWithCustomPrice, usdAmount)
      const expected = scaleDecimal((decimalUsdAmount / price).toString(), tokenWithCustomPrice.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly for a token with standard decimals', () => {
      const price = 0.5
      const decimalUsdAmount = 1
      const tokenWithCustomPrice = randomTokenWithPrice(STANDARD_DECIMALS, price)
      const usdAmount = scaleDecimal(decimalUsdAmount.toString(), STANDARD_DECIMALS)

      const result = convertUsdToTokenAmount(tokenWithCustomPrice, usdAmount)
      const expected = scaleDecimal((decimalUsdAmount / price).toString(), tokenWithCustomPrice.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly for a token with more than standard decimals', () => {
      const price = 1.5
      const decimalUsdAmount = 3
      const tokenWithCustomPrice = randomTokenWithPrice(HIGHER_THAN_STANDARD_DECIMALS, price)
      const usdAmount = scaleDecimal(decimalUsdAmount.toString(), STANDARD_DECIMALS)

      const result = convertUsdToTokenAmount(tokenWithCustomPrice, usdAmount)
      const expected = scaleDecimal((decimalUsdAmount / price).toString(), tokenWithCustomPrice.decimals)

      expect(result.toString()).toBe(expected.toString())
    })
  })
})

describe('convertTokenAmountToUsd', () => {
  describe('when tokenAmount is zero', () => {
    it('returns 0', () => {
      const mockToken = randomToken()
      const tokenAmount = new BigInt(0)

      const result = convertTokenAmountToUsd(mockToken, tokenAmount)
      expect(result.toString()).toBe('0')
    })
  })

  describe('when token has different prices', () => {
    it('converts correctly for a token with less than standard decimals', () => {
      const price = 2
      const decimalTokenAmount = 50
      const tokenWithCustomPrice = randomTokenWithPrice(LOWER_THAN_STANDARD_DECIMALS, price)
      const tokenAmount = scaleDecimal(decimalTokenAmount.toString(), tokenWithCustomPrice.decimals)

      const result = convertTokenAmountToUsd(tokenWithCustomPrice, tokenAmount)
      const expected = scaleDecimal((decimalTokenAmount * price).toString(), STANDARD_DECIMALS)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly for a token with standard decimals', () => {
      const price = 0.5
      const decimalTokenAmount = 2
      const tokenWithCustomPrice = randomTokenWithPrice(STANDARD_DECIMALS, price)
      const tokenAmount = scaleDecimal(decimalTokenAmount.toString(), tokenWithCustomPrice.decimals)

      const result = convertTokenAmountToUsd(tokenWithCustomPrice, tokenAmount)
      const expected = scaleDecimal((decimalTokenAmount * price).toString(), STANDARD_DECIMALS)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly for a token with more than standard decimals', () => {
      const price = 1.5
      const decimalTokenAmount = 0.5
      const tokenWithCustomPrice = randomTokenWithPrice(HIGHER_THAN_STANDARD_DECIMALS, price)
      const tokenAmount = scaleDecimal(decimalTokenAmount.toString(), tokenWithCustomPrice.decimals)

      const result = convertTokenAmountToUsd(tokenWithCustomPrice, tokenAmount)
      const expected = scaleDecimal((decimalTokenAmount * price).toString(), STANDARD_DECIMALS)

      expect(result.toString()).toBe(expected.toString())
    })
  })
})

describe('convertAmountBetweenTokens', () => {
  describe('when amount is zero', () => {
    it('returns 0 with target token decimals', () => {
      const mockTokenFrom = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const mockTokenTo = randomToken(STANDARD_DECIMALS)
      const amountFrom = new BigInt(0)

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('0')
      expect(result.length).toBe(mockTokenTo.decimals)
    })
  })

  describe('when converting between tokens with different decimals', () => {
    it('converts from less than standard to standard decimals', () => {
      const decimalAmount = 100
      const mockTokenFrom = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const mockTokenTo = randomToken(STANDARD_DECIMALS)
      const amountFrom = scaleDecimal(decimalAmount.toString(), mockTokenFrom.decimals)

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      const expected = scaleDecimal(decimalAmount.toString(), STANDARD_DECIMALS)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts from less than standard to more than standard decimals', () => {
      const decimalAmount = 100
      const mockTokenFrom = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const mockTokenTo = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const amountFrom = scaleDecimal(decimalAmount.toString(), mockTokenFrom.decimals)

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      const expected = scaleDecimal(decimalAmount.toString(), mockTokenTo.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts from standard to more than standard decimals', () => {
      const decimalAmount = 100
      const mockTokenFrom = randomToken(STANDARD_DECIMALS)
      const mockTokenTo = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const amountFrom = scaleDecimal(decimalAmount.toString(), mockTokenFrom.decimals)

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      const expected = scaleDecimal(decimalAmount.toString(), mockTokenTo.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts from more than standard to less than standard decimals', () => {
      const decimalAmount = 100
      const mockTokenFrom = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const mockTokenTo = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const amountFrom = scaleDecimal(decimalAmount.toString(), mockTokenFrom.decimals)

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      const expected = scaleDecimal(decimalAmount.toString(), mockTokenTo.decimals)

      expect(result.toString()).toBe(expected.toString())
    })
  })

  describe('convertAmountBetweenTokens with different prices', () => {
    it('converts correctly when tokens have different prices and less than standard decimals', () => {
      const decimalAmount = 100
      const priceA = 2
      const priceB = 0.5
      const tokenA = randomTokenWithPrice(LOWER_THAN_STANDARD_DECIMALS, priceA)
      const tokenB = randomTokenWithPrice(LOWER_THAN_STANDARD_DECIMALS, priceB)
      const amountA = scaleDecimal(decimalAmount.toString(), tokenA.decimals)

      const result = convertAmountBetweenTokens(amountA, tokenA, tokenB)
      const expected = scaleDecimal(((decimalAmount * priceA) / priceB).toString(), tokenB.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly when tokens have different prices and standard decimals', () => {
      const decimalAmount = 100
      const priceA = 2
      const priceB = 0.5
      const tokenA = randomTokenWithPrice(STANDARD_DECIMALS, priceA)
      const tokenB = randomTokenWithPrice(STANDARD_DECIMALS, priceB)
      const amountA = scaleDecimal(decimalAmount.toString(), tokenA.decimals)

      const result = convertAmountBetweenTokens(amountA, tokenA, tokenB)
      const expected = scaleDecimal(((decimalAmount * priceA) / priceB).toString(), tokenB.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly when tokens have different prices and more than standard decimals', () => {
      const decimalAmount = 100
      const priceA = 2
      const priceB = 0.5
      const tokenA = randomTokenWithPrice(HIGHER_THAN_STANDARD_DECIMALS, priceA)
      const tokenB = randomTokenWithPrice(HIGHER_THAN_STANDARD_DECIMALS, priceB)
      const amountA = scaleDecimal(decimalAmount.toString(), tokenA.decimals)

      const result = convertAmountBetweenTokens(amountA, tokenA, tokenB)
      const expected = scaleDecimal(((decimalAmount * priceA) / priceB).toString(), tokenB.decimals)

      expect(result.toString()).toBe(expected.toString())
    })
  })
})
