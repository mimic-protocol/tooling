import { Token } from '../../src/tokens'
import { randomAddress, randomToken } from '../helpers'

describe('Token', () => {
  describe('when creating a token', () => {
    it('has an immutable address', () => {
      const token = randomToken()
      const originalAddress = token.address.clone()
      const modifiedAddress = token.address
      modifiedAddress[0] = 0xff

      expect(token.address.toHexString()).not.toBe(modifiedAddress.toHexString())
      expect(token.address.toHexString()).toBe(originalAddress.toHexString())
    })
  })

  describe('parse', () => {
    it('parses a token', () => {
      const token = randomToken()
      const serialized = token.serialize()
      const parsed = Token.parse(serialized)

      expect(parsed.equals(token)).toBe(true)
    })
  })

  describe('equals', () => {
    describe('when comparing two tokens', () => {
      it('returns true for tokens with the same address and chainId', () => {
        const address = randomAddress()
        const chainId: u64 = 1
        const token1 = new Token(address, chainId, 18, 'TOKEN1')
        const token2 = new Token(address, chainId, 6, 'TOKEN2')

        expect(token1.equals(token2)).toBe(true)
      })

      it('returns false for tokens with different addresses', () => {
        const chainId: u64 = 1
        const token1 = new Token(randomAddress(), chainId, 18, 'TOKEN')
        const token2 = new Token(randomAddress(), chainId, 18, 'TOKEN')

        expect(token1.equals(token2)).toBe(false)
      })

      it('returns false for tokens with different chainIds', () => {
        const address = randomAddress()
        const token1 = new Token(address, 1, 18, 'TOKEN')
        const token2 = new Token(address, 137, 18, 'TOKEN')

        expect(token1.equals(token2)).toBe(false)
      })
    })
  })
})
