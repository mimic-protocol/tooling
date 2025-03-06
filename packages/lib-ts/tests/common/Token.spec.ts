import { Address, Token } from '../../common'
import { randomAddress } from '../helpers'

describe('Token', () => {
  describe('when creating a token', () => {
    it('has the correct properties', () => {
      const symbol = 'TEST'
      const address = Address.fromString(randomAddress())
      const chainId: u64 = 1
      const decimals: u8 = 18

      const token = new Token(symbol, address, chainId, decimals)

      expect(token.symbol).toBe(symbol)
      expect(token.address.toHex()).toBe(address.toHex())
      expect(token.chainId).toBe(chainId)
      expect(token.decimals).toBe(decimals)
    })

    it('has an inmutable address', () => {
      const originalAddress = Address.fromString(randomAddress())
      const token = new Token('TEST', originalAddress, 1, 18)
      const modifiedAddress = token.address
      modifiedAddress[0] = 0xff

      expect(token.address.toHex()).not.toBe(modifiedAddress.toHex())
      expect(token.address.toHex()).toBe(originalAddress.toHex())
    })
  })

  describe('equals', () => {
    describe('when comparing two tokens', () => {
      it('returns true for tokens with the same address and chainId', () => {
        const address = Address.fromString(randomAddress())
        const chainId: u64 = 1
        const token1 = new Token('TOKEN1', address, chainId, 18)
        const token2 = new Token('TOKEN2', address, chainId, 6)

        expect(Token.equals(token1, token2)).toBe(true)
        expect(token1.equals(token2)).toBe(true)
      })

      it('returns false for tokens with different addresses', () => {
        const chainId: u64 = 1
        const token1 = new Token('TOKEN', Address.fromString(randomAddress()), chainId, 18)
        const token2 = new Token('TOKEN', Address.fromString(randomAddress()), chainId, 18)

        expect(Token.equals(token1, token2)).toBe(false)
        expect(token1.equals(token2)).toBe(false)
      })

      it('returns false for tokens with different chainIds', () => {
        const address = Address.fromString(randomAddress())
        const token1 = new Token('TOKEN', address, 1, 18)
        const token2 = new Token('TOKEN', address, 137, 18)

        expect(Token.equals(token1, token2)).toBe(false)
        expect(token1.equals(token2)).toBe(false)
      })
    })
  })
})
