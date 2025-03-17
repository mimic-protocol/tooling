import { BigInt } from '../../common'
import { USD } from '../../common/USD'
import { STANDARD_DECIMALS } from '../../constants'
import { convertTokenAmountToUsd, convertUsdToTokenAmount, scale, unscale } from '../../helpers'
import { buildZeroPadding, randomToken, randomTokenWithPrice } from '../helpers'

const LOWER_THAN_STANDARD_DECIMALS: u8 = STANDARD_DECIMALS - 12
const HIGHER_THAN_STANDARD_DECIMALS: u8 = STANDARD_DECIMALS + 12

describe('scale', () => {
  describe('when converting zero', () => {
    it('returns zero', () => {
      const mockToken = randomToken()
      const result = scale('0', mockToken.decimals)

      expect(result.toString()).toBe('0')
    })
  })

  describe('when converting whole numbers', () => {
    it('converts correctly for token with less than standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const result = scale(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount + buildZeroPadding(mockToken.decimals))
    })

    it('converts correctly for token with standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const result = scale(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount + buildZeroPadding(mockToken.decimals))
    })

    it('converts correctly for token with more than standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const result = scale(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount + buildZeroPadding(mockToken.decimals))
    })
  })

  describe('when converting decimal numbers', () => {
    it('handles decimals correctly for token with less than standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const result = scale(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount.replace('.', '') + buildZeroPadding(mockToken.decimals - 1))
    })

    it('handles decimals correctly for token with standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const result = scale(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount.replace('.', '') + buildZeroPadding(mockToken.decimals - 1))
    })

    it('handles decimals correctly for token with more than standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const result = scale(decimalAmount, mockToken.decimals)

      expect(result.toString()).toBe(decimalAmount.replace('.', '') + buildZeroPadding(mockToken.decimals - 1))
    })
  })

  describe('when handling invalid inputs', () => {
    it('throws an error when amount has multiple decimal points', () => {
      expect(() => {
        const invalidAmount = '100.45.67'
        const mockToken = randomToken()
        scale(invalidAmount, mockToken.decimals)
      }).toThrow()
    })

    it('throws an error when amount has non-numeric characters', () => {
      expect(() => {
        const invalidAmount = '100a02'
        const mockToken = randomToken()
        scale(invalidAmount, mockToken.decimals)
      }).toThrow()

      expect(() => {
        const invalidAmount = '10.0a02'
        const mockToken = randomToken()
        scale(invalidAmount, mockToken.decimals)
      }).toThrow()
    })
  })
})

describe('unscale', () => {
  describe('when converting zero', () => {
    it('returns "0"', () => {
      const mockToken = randomToken()
      const zeroAmount = new BigInt(0)
      const result = unscale(zeroAmount, mockToken.decimals)

      expect(result).toBe('0')
    })
  })

  describe('when converting whole numbers', () => {
    it('converts correctly for token with less than standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const wholeAmount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(wholeAmount, mockToken.decimals)

      expect(result).toBe(decimalAmount + '.' + buildZeroPadding(mockToken.decimals))
    })

    it('converts correctly for token with standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const wholeAmount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(wholeAmount, mockToken.decimals)

      expect(result).toBe(decimalAmount + '.' + buildZeroPadding(mockToken.decimals))
    })

    it('converts correctly for token with more than standard decimals', () => {
      const decimalAmount = '100'
      const mockToken = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const wholeAmount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(wholeAmount, mockToken.decimals)

      expect(result).toBe(decimalAmount + '.' + buildZeroPadding(mockToken.decimals))
    })
  })

  describe('when converting decimal numbers', () => {
    it('handles decimals correctly for token with less than standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(LOWER_THAN_STANDARD_DECIMALS)
      const amount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(amount, mockToken.decimals)

      expect(result).toBe(decimalAmount + buildZeroPadding(mockToken.decimals - 1))
    })

    it('handles decimals correctly for token with standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const amount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(amount, mockToken.decimals)

      expect(result).toBe(decimalAmount + buildZeroPadding(mockToken.decimals - 1))
    })

    it('handles decimals correctly for token with more than standard decimals', () => {
      const decimalAmount = '100.5'
      const mockToken = randomToken(HIGHER_THAN_STANDARD_DECIMALS)
      const amount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(amount, mockToken.decimals)

      expect(result).toBe(decimalAmount + buildZeroPadding(mockToken.decimals - 1))
    })
  })

  describe('when handling small decimal values', () => {
    it('handles values smaller than 1 correctly', () => {
      const decimalAmount = '0.12345'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const smallAmount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(smallAmount, mockToken.decimals)

      expect(result).toBe(decimalAmount + buildZeroPadding(mockToken.decimals - 5))
    })

    it('handles very small values correctly', () => {
      const decimalAmount = '0.' + buildZeroPadding(STANDARD_DECIMALS - 1) + '5'
      const mockToken = randomToken(STANDARD_DECIMALS)
      const verySmallAmount = scale(decimalAmount, mockToken.decimals)
      const result = unscale(verySmallAmount, mockToken.decimals)

      expect(result).toBe(decimalAmount)
    })
  })
})

describe('convertUsdToTokenAmount', () => {
  describe('when usdAmount is zero', () => {
    it('returns 0 with correct decimals', () => {
      const mockToken = randomToken()
      const usdAmount = USD.zero()
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
      const usdAmount = USD.fromDecimal(decimalUsdAmount.toString())

      const result = convertUsdToTokenAmount(tokenWithCustomPrice, usdAmount)
      const expected = scale((decimalUsdAmount / price).toString(), tokenWithCustomPrice.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly for a token with standard decimals', () => {
      const price = 0.5
      const decimalUsdAmount = 1
      const tokenWithCustomPrice = randomTokenWithPrice(STANDARD_DECIMALS, price)
      const usdAmount = USD.fromDecimal(decimalUsdAmount.toString())

      const result = convertUsdToTokenAmount(tokenWithCustomPrice, usdAmount)
      const expected = scale((decimalUsdAmount / price).toString(), tokenWithCustomPrice.decimals)

      expect(result.toString()).toBe(expected.toString())
    })

    it('converts correctly for a token with more than standard decimals', () => {
      const price = 1.5
      const decimalUsdAmount = 3
      const tokenWithCustomPrice = randomTokenWithPrice(HIGHER_THAN_STANDARD_DECIMALS, price)
      const usdAmount = USD.fromDecimal(decimalUsdAmount.toString())

      const result = convertUsdToTokenAmount(tokenWithCustomPrice, usdAmount)
      const expected = scale((decimalUsdAmount / price).toString(), tokenWithCustomPrice.decimals)

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
      const tokenAmount = scale(decimalTokenAmount.toString(), tokenWithCustomPrice.decimals)

      const result = convertTokenAmountToUsd(tokenWithCustomPrice, tokenAmount)

      expect(result.toString()).toBe('100.' + buildZeroPadding(STANDARD_DECIMALS))
    })

    it('converts correctly for a token with standard decimals', () => {
      const price = 0.5
      const decimalTokenAmount = 2
      const tokenWithCustomPrice = randomTokenWithPrice(STANDARD_DECIMALS, price)
      const tokenAmount = scale(decimalTokenAmount.toString(), tokenWithCustomPrice.decimals)

      const result = convertTokenAmountToUsd(tokenWithCustomPrice, tokenAmount)

      expect(result.toString()).toBe('1.' + buildZeroPadding(STANDARD_DECIMALS))
    })

    it('converts correctly for a token with more than standard decimals', () => {
      const price = 1.5
      const decimalTokenAmount = 0.5
      const tokenWithCustomPrice = randomTokenWithPrice(HIGHER_THAN_STANDARD_DECIMALS, price)
      const tokenAmount = scale(decimalTokenAmount.toString(), tokenWithCustomPrice.decimals)

      const result = convertTokenAmountToUsd(tokenWithCustomPrice, tokenAmount)

      expect(result.toString()).toBe('0.75' + buildZeroPadding(STANDARD_DECIMALS - 2))
    })
  })
})
