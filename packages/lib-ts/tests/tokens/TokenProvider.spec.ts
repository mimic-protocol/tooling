import { ERC20Token, TokenProvider } from '../../src/tokens'
import { ChainId } from '../../src/types'

describe('TokenProvider', () => {
  describe('register', () => {
    describe('when registering a token for a chain', () => {
      it('should register the token successfully', () => {
        const provider = new TokenProvider('TEST')
        const token = ERC20Token.native(ChainId.ETHEREUM)
        provider.register(ChainId.ETHEREUM, token)

        expect(provider.isSupported(ChainId.ETHEREUM)).toBe(true)
      })

      it('should allow method chaining', () => {
        const provider = new TokenProvider('TEST')
        const token1 = ERC20Token.native(ChainId.ETHEREUM)
        const token2 = ERC20Token.native(ChainId.ARBITRUM)

        provider.register(ChainId.ETHEREUM, token1).register(ChainId.ARBITRUM, token2)

        expect(provider.isSupported(ChainId.ETHEREUM)).toBe(true)
        expect(provider.isSupported(ChainId.ARBITRUM)).toBe(true)
      })
    })
  })

  describe('on', () => {
    describe('when token is registered for the chain', () => {
      it('should return the registered token', () => {
        const provider = new TokenProvider('TEST')
        const token = ERC20Token.native(ChainId.ETHEREUM)
        provider.register(ChainId.ETHEREUM, token)

        const resolved = provider.on(ChainId.ETHEREUM)

        expect(resolved.address.toHexString()).toBe(token.address.toHexString())
        expect(resolved.chainId).toBe(ChainId.ETHEREUM)
        expect(resolved.symbol).toBe(token.symbol)
        expect(resolved.decimals).toBe(token.decimals)
      })
    })

    describe('when token is not registered for the chain', () => {
      it('should throw an error', () => {
        expect(() => {
          const provider = new TokenProvider('TEST')
          provider.on(ChainId.ETHEREUM)
        }).toThrow()
      })
    })
  })

  describe('isSupported', () => {
    describe('when token is registered for the chain', () => {
      it('should return true', () => {
        const provider = new TokenProvider('TEST')
        const token = ERC20Token.native(ChainId.ETHEREUM)
        provider.register(ChainId.ETHEREUM, token)

        expect(provider.isSupported(ChainId.ETHEREUM)).toBe(true)
      })
    })

    describe('when token is not registered for the chain', () => {
      it('should return false', () => {
        const provider = new TokenProvider('TEST')

        expect(provider.isSupported(ChainId.ETHEREUM)).toBe(false)
        expect(provider.isSupported(ChainId.ARBITRUM)).toBe(false)
      })
    })
  })
})
