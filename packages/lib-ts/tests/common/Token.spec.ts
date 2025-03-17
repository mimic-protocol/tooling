import { Token } from '../../common'
import { randomAddress, randomToken } from '../helpers'

describe('Token', () => {
  describe('when creating a token', () => {
    it('has an inmutable address', () => {
      const token = randomToken()
      const originalAddress = token.address.clone()
      const modifiedAddress = token.address
      modifiedAddress[0] = 0xff

      expect(token.address.toHex()).not.toBe(modifiedAddress.toHex())
      expect(token.address.toHex()).toBe(originalAddress.toHex())
    })
  })

  describe('equals', () => {
    describe('when comparing two tokens', () => {
      it('returns true for tokens with the same address and chainId', () => {
        const address = randomAddress()
        const chainId: u64 = 1
        const token1 = new Token('TOKEN1', address, chainId, 18)
        const token2 = new Token('TOKEN2', address, chainId, 6)

        expect(token1.equals(token2)).toBe(true)
      })

      it('returns false for tokens with different addresses', () => {
        const chainId: u64 = 1
        const token1 = new Token('TOKEN', randomAddress(), chainId, 18)
        const token2 = new Token('TOKEN', randomAddress(), chainId, 18)

        expect(token1.equals(token2)).toBe(false)
      })

      it('returns false for tokens with different chainIds', () => {
        const address = randomAddress()
        const token1 = new Token('TOKEN', address, 1, 18)
        const token2 = new Token('TOKEN', address, 137, 18)

        expect(token1.equals(token2)).toBe(false)
      })
    })
  })
})
