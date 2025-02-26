import { BigInt } from '../../common'
import { convertAmountBetweenTokens, convertTokenAmountToUsd, convertUsdToTokenAmount } from '../../helpers'
import { randomToken } from '../helpers'

describe('convertUsdToTokenAmount', () => {
  describe('when usdAmount is zero', () => {
    it('returns 0 with correct decimals', () => {
      const mockToken = randomToken(6)
      const usdAmount = new BigInt(0)
      const result = convertUsdToTokenAmount(mockToken, usdAmount)

      expect(result.toString()).toBe('0')
      expect(result.length).toBe(mockToken.decimals)
    })
  })

  describe('when converting $100 to a token with 6 decimals', () => {
    it('converts correctly', () => {
      const mockToken = randomToken(6)
      const usdAmount = BigInt.fromString('1e20') // $100 in 18 decimals

      const result = convertUsdToTokenAmount(mockToken, usdAmount)
      expect(result.toString()).toBe('100000000') // 100 tokens in 6 decimals
    })
  })

  describe('when converting to a token with more decimals than the source', () => {
    it('converts correctly from USD to a token with 18 decimals', () => {
      const mockToken = randomToken(18)
      const usdAmount = BigInt.fromString('1e20') // $100 in 18 decimals

      const result = convertUsdToTokenAmount(mockToken, usdAmount)
      expect(result.toString()).toBe('100000000000000000000') // 100 tokens in 18 decimals
    })
  })

  describe('when converting a fractional USD amount', () => {
    it('handles small USD amounts correctly', () => {
      const mockToken = randomToken(6)
      const usdAmount = BigInt.fromString('5e17') // $0.5 in 18 decimals

      const result = convertUsdToTokenAmount(mockToken, usdAmount)
      expect(result.toString()).toBe('500000') // 0.5 tokens in 6 decimals
    })
  })

  describe('when handling huge decimal differences', () => {
    it('converts correctly from USD (18 decimals) to a token with 1 decimal', () => {
      const mockToken = randomToken(1)
      const usdAmount = BigInt.fromString('1e18') // $1 in 18 decimals

      const result = convertUsdToTokenAmount(mockToken, usdAmount)
      expect(result.toString()).toBe('10') // 1 token in 1 decimal
    })
  })

  describe('when handling very small USD amounts', () => {
    it('handles tiny USD amounts correctly', () => {
      const mockToken = randomToken(6)
      const usdAmount = BigInt.fromString('1') // $0.000000000000000001 in 18 decimals

      const result = convertUsdToTokenAmount(mockToken, usdAmount)
      expect(result.toString()).toBe('0') // 0 tokens due to precision loss
      expect(result.length).toBe(mockToken.decimals)
    })
  })
})

describe('convertTokenAmountToUsd', () => {
  describe('when tokenAmount is zero', () => {
    it('returns 0 with 18 decimals', () => {
      const mockToken = randomToken(6)
      const tokenAmount = new BigInt(0)

      const result = convertTokenAmountToUsd(mockToken, tokenAmount)
      expect(result.toString()).toBe('0')
      expect(result.length).toBe(18)
    })
  })

  describe('when converting 100 tokens with 6 decimals', () => {
    it('converts correctly', () => {
      const mockToken = randomToken(6)
      const tokenAmount = BigInt.fromString('1e8') // 100 tokens in 6 decimals

      const result = convertTokenAmountToUsd(mockToken, tokenAmount)
      expect(result.toString()).toBe('100000000000000000000') // $100 in 18 decimals
    })
  })

  describe('when converting a fractional token amount', () => {
    it('handles small token amounts correctly', () => {
      const mockToken = randomToken(18)
      const tokenAmount = BigInt.fromString('5e17') // 0.5 tokens in 18 decimals

      const result = convertTokenAmountToUsd(mockToken, tokenAmount)
      expect(result.toString()).toBe('500000000000000000') // $0.5 in 18 decimals
    })
  })

  describe('when handling huge decimal differences', () => {
    it('converts correctly from a token with 1 decimal to USD', () => {
      const mockToken = randomToken(1)
      const tokenAmount = BigInt.fromString('10') // 1 token in 1 decimal

      const result = convertTokenAmountToUsd(mockToken, tokenAmount)
      expect(result.toString()).toBe('1000000000000000000') // $1 in 18 decimals
    })
  })

  describe('when handling very small token amounts', () => {
    it('handles tiny token amounts correctly', () => {
      const mockToken = randomToken(18)
      const tokenAmount = BigInt.fromString('1') // 0.000000000000000001 tokens in 18 decimals

      const result = convertTokenAmountToUsd(mockToken, tokenAmount)
      expect(result.toString()).toBe('1') // $0.000000000000000001 in 18 decimals
    })
  })
})

describe('convertAmountBetweenTokens', () => {
  describe('when converting between tokens with different decimals', () => {
    it('converts correctly', () => {
      const mockTokenFrom = randomToken(6)
      const mockTokenTo = randomToken(18)
      const amountFrom = BigInt.fromString('100000000') // 100 tokens in 6 decimals

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('100000000000000000000') // 100 tokens in 18 decimals
    })
  })

  describe('when amount is zero', () => {
    it('returns 0 with target token decimals', () => {
      const mockTokenFrom = randomToken(6)
      const mockTokenTo = randomToken(18)
      const amountFrom = new BigInt(0)

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('0')
      expect(result.length).toBe(mockTokenTo.decimals)
    })
  })

  describe('when converting between tokens with the same decimals', () => {
    it('maintains the same amount when prices are equal', () => {
      const mockTokenFrom = randomToken(6)
      const mockTokenTo = randomToken(6)
      const amountFrom = BigInt.fromString('100000000') // 100 tokens in 6 decimals

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('100000000') // 100 tokens in 6 decimals
    })
  })

  describe('when converting from higher to lower decimals', () => {
    it('converts correctly from 18 decimals to 6 decimals', () => {
      const mockTokenFrom = randomToken(18)
      const mockTokenTo = randomToken(6)
      const amountFrom = BigInt.fromString('100000000000000000000') // 100 tokens in 18 decimals

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('100000000') // 100 tokens in 6 decimals
    })
  })

  describe('when dealing with precision loss', () => {
    it('handles conversion that would result in fractional amounts correctly', () => {
      const mockTokenFrom = randomToken(6)
      const mockTokenTo = randomToken(8)
      const amountFrom = BigInt.fromString('1') // 0.000001 tokens in 6 decimals

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('100') // 0.000001 tokens in 8 decimals
    })
  })

  describe('when converting between tokens with extreme decimal differences', () => {
    it('converts correctly from 1 decimal to 18 decimals', () => {
      const mockTokenFrom = randomToken(1)
      const mockTokenTo = randomToken(18)
      const amountFrom = BigInt.fromString('10') // 1 token in 1 decimal

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('1000000000000000000') // 1 token in 18 decimals
    })

    it('converts correctly from 18 decimals to 1 decimal', () => {
      const mockTokenFrom = randomToken(18)
      const mockTokenTo = randomToken(1)
      const amountFrom = BigInt.fromString('1000000000000000000') // 1 token in 18 decimals

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('10') // 1 token in 1 decimal
    })
  })

  describe('when handling very small amounts', () => {
    it('handles potential precision loss correctly', () => {
      const mockTokenFrom = randomToken(3)
      const mockTokenTo = randomToken(18)
      const amountFrom = BigInt.fromString('1') // 0.001 tokens in 3 decimals

      const result = convertAmountBetweenTokens(amountFrom, mockTokenFrom, mockTokenTo)
      expect(result.toString()).toBe('1000000000000000') // 0.001 tokens in 18 decimals
    })
  })
})
