import { environment } from '../src/environment'
import { ListType, STANDARD_DECIMALS } from '../src/helpers'
import { TokenAmount, USD } from '../src/tokens'
import { Address, BigInt } from '../src/types'

import { randomAddress, randomToken, randomTokenWithPrice, setRelevantTokens } from './helpers'

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

  describe('getRelevantTokens', () => {
    it('returns the correct tokens', () => {
      const userAddress = Address.fromString(randomAddress())
      const chainId = 1
      const tokenAmounts = [
        new TokenAmount(randomToken(), BigInt.fromI32(100).upscale(STANDARD_DECIMALS)),
        new TokenAmount(randomToken(), BigInt.fromI32(200).upscale(STANDARD_DECIMALS)),
      ]
      setRelevantTokens(userAddress, chainId, tokenAmounts)

      const result = environment.getRelevantTokens(
        userAddress,
        [chainId, 2],
        USD.zero(),
        [randomToken(), randomToken()],
        ListType.AllowList
      )

      expect(result.length).toBe(tokenAmounts.length)
      for (let i = 0; i < result.length; i++) {
        expect(result[i].equals(tokenAmounts[i])).toBe(true)
      }
    })
  })
})
