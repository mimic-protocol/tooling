import { environment } from '../src/environment'
import { STANDARD_DECIMALS } from '../src/helpers'
import { BigInt } from '../src/types'

import { randomTokenWithPrice } from './helpers'

describe('environment', () => {
  describe('getPrice', () => {
    it('returns the correct token price', () => {
      const priceUsd = 3.5
      const token = randomTokenWithPrice(STANDARD_DECIMALS, priceUsd)

      const result = environment.getPrice(token)

      const expectedValue = BigInt.fromStringDecimal(priceUsd.toString(), STANDARD_DECIMALS)
      expect(result.value.toString()).toBe(expectedValue.toString())
    })
  })
})
