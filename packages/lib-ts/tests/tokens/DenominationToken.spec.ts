import { USD_ADDRESS } from '../../src/helpers'
import { DenominationToken, ERC20Token } from '../../src/tokens'
import { Address, ChainId } from '../../src/types'
import { CHAIN_IDS, randomEvmAddress } from '../helpers'

describe('DenominationToken', () => {
  describe('USD', () => {
    it('creates the USD denomination token', () => {
      const token = DenominationToken.USD()

      expect(token.address.toHexString()).toBe(USD_ADDRESS)
      expect(token.symbol).toBe('USD')
      expect(token.decimals).toBe(18)
    })
  })

  describe('address', () => {
    it('has an immutable address', () => {
      const token = DenominationToken.USD()
      const originalAddress = token.address.clone()
      const modifiedAddress = token.address
      modifiedAddress[0] = 0xff

      expect(token.address.toHexString()).not.toBe(modifiedAddress.toHexString())
      expect(token.address.toHexString()).toBe(originalAddress.toHexString())
    })
  })

  describe('isUSD', () => {
    describe('when the token is USD', () => {
      it('returns true', () => {
        const token = DenominationToken.USD()
        expect(token.isUSD()).toBe(true)
      })
    })

    describe('when the token is not USD', () => {
      it('returns false', () => {
        const token = new DenominationToken(randomEvmAddress(), 6, 'EUR')
        expect(token.isUSD()).toBe(false)
      })
    })
  })

  describe('isNative', () => {
    describe('when the token is USD', () => {
      it('returns true', () => {
        const token = DenominationToken.USD()
        expect(token.isNative()).toBe(false)
      })
    })

    describe('when the token is not USD', () => {
      it('returns false', () => {
        const token = new DenominationToken(randomEvmAddress(), 6, 'EUR')
        expect(token.isNative()).toBe(false)
      })
    })
  })

  describe('hasChain', () => {
    describe('when the token is USD', () => {
      it('returns true', () => {
        const token = DenominationToken.USD()

        for (let i = 0; i < CHAIN_IDS.length; i++) expect(token.hasChain(CHAIN_IDS[i])).toBe(true)
      })
    })

    describe('when the token is not USD', () => {
      it('returns true', () => {
        const token = new DenominationToken(randomEvmAddress(), 6, 'EUR')

        for (let i = 0; i < CHAIN_IDS.length; i++) expect(token.hasChain(CHAIN_IDS[i])).toBe(true)
      })
    })
  })

  describe('equals', () => {
    describe('when comparing two denomination tokens', () => {
      it('returns true for tokens with the same address', () => {
        const token1 = DenominationToken.USD()
        const token2 = DenominationToken.USD()

        expect(token1.equals(token2)).toBe(true)
      })

      it('returns false for tokens with different addresses', () => {
        const token1 = new DenominationToken(randomEvmAddress(), 18, 'TOKEN')
        const token2 = new DenominationToken(randomEvmAddress(), 18, 'TOKEN')

        expect(token1.equals(token2)).toBe(false)
      })
    })

    describe('when comparing two different tokens', () => {
      it('returns false for tokens with the same address', () => {
        const token1 = DenominationToken.USD()
        const token2 = ERC20Token.fromAddress(Address.USD(), ChainId.ETHEREUM, 6, 'USD')

        expect(token1.equals(token2)).toBe(false)
      })

      it('returns false for tokens with different addresses', () => {
        const token1 = new DenominationToken(randomEvmAddress(), 18, 'TOKEN')
        const token2 = ERC20Token.native(ChainId.ETHEREUM)

        expect(token1.equals(token2)).toBe(false)
      })
    })
  })

  describe('toString', () => {
    it('returns USD', () => {
      const usd = DenominationToken.USD()

      expect(usd.toString()).toBe('USD')
    })
  })
})
