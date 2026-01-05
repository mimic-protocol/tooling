import { STANDARD_DECIMALS } from '../../src/helpers'
import { TokenPriceQueryResponse } from '../../src/queries'
import { BigInt } from '../../src/types'
import { zeroPadded } from '../helpers'

describe('TokenPriceQueryResponse', () => {
  describe('toPrices', () => {
    describe('when response is successful', () => {
      describe('when prices array has multiple elements', () => {
        it('should return prices array with correct values', () => {
          const response = new TokenPriceQueryResponse(
            'true',
            [
              zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS),
              zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS),
              zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS),
            ],
            ''
          )
          const result = response.toPrices()

          expect(result.isOk).toBe(true)
          const prices = result.unwrap()
          expect(prices.length).toBe(3)
          expect(prices[0].toString()).toBe('1')
          expect(prices[1].toString()).toBe('2')
          expect(prices[2].toString()).toBe('3')
        })
      })

      describe('when prices array is empty', () => {
        it('should return empty prices array', () => {
          const response = new TokenPriceQueryResponse('true', [], '')
          const result = response.toPrices()

          expect(result.isOk).toBe(true)
          const prices = result.unwrap()
          expect(prices.length).toBe(0)
        })
      })

      describe('when prices array has large values', () => {
        it('should correctly convert large price values', () => {
          const largePrice = zeroPadded(BigInt.fromI32(1000), STANDARD_DECIMALS) // 1000 USD
          const response = new TokenPriceQueryResponse('true', [largePrice], '')
          const result = response.toPrices()

          expect(result.isOk).toBe(true)
          const prices = result.unwrap()
          expect(prices[0].toString()).toBe('1000')
        })
      })

      describe('when prices array has small values', () => {
        it('should correctly convert small price values', () => {
          const smallPrice = zeroPadded(BigInt.fromI32(1), 15) // 0.001 USD (1 * 10^15)
          const response = new TokenPriceQueryResponse('true', [smallPrice], '')
          const result = response.toPrices()

          expect(result.isOk).toBe(true)
          const prices = result.unwrap()
          expect(prices[0].toString()).toBe('0.001')
        })
      })
    })

    describe('when response is not successful', () => {
      describe('when error message is provided', () => {
        it('should return error with provided message', () => {
          const errorMessage = 'Token not found'
          const response = new TokenPriceQueryResponse('false', [], errorMessage)
          const result = response.toPrices()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new TokenPriceQueryResponse('false', [], '')
          const result = response.toPrices()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting price')
        })
      })
    })
  })
})
