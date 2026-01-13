import { Arbitrum, Base, BaseSepolia, Ethereum, Gnosis, Optimism, Sonic } from '../../src/chains'
import { BlockchainToken, Tokens } from '../../src/tokens'

function expectTokenMatches(resolved: BlockchainToken, expected: BlockchainToken): void {
  expect(resolved.chainId).toBe(expected.chainId)
  expect(resolved.symbol).toBe(expected.symbol)
  expect(resolved.address.toHexString()).toBe(expected.address.toHexString())
  expect(resolved.decimals).toBe(expected.decimals)
}

describe('Tokens', () => {
  describe('USDC', () => {
    describe('when accessing the static getter', () => {
      it('should return a TokenProvider instance', () => {
        const provider = Tokens.USDC

        expect(provider).not.toBeNull()
        expect(provider.isSupported(Ethereum.CHAIN_ID)).toBe(true)
        expect(provider.isSupported(BaseSepolia.CHAIN_ID)).toBe(false)
      })
    })

    describe('when resolving token for a chain', () => {
      describe('when token is supported on chain', () => {
        it('should return token for Ethereum', () => {
          const token = Tokens.USDC.on(Ethereum.CHAIN_ID)
          expectTokenMatches(token, Ethereum.USDC)
        })

        it('should return token for Arbitrum', () => {
          const token = Tokens.USDC.on(Arbitrum.CHAIN_ID)
          expectTokenMatches(token, Arbitrum.USDC)
        })

        it('should return token for Base', () => {
          const token = Tokens.USDC.on(Base.CHAIN_ID)
          expectTokenMatches(token, Base.USDC)
        })

        it('should return token for Optimism', () => {
          const token = Tokens.USDC.on(Optimism.CHAIN_ID)
          expectTokenMatches(token, Optimism.USDC)
        })

        it('should return token for Gnosis', () => {
          const token = Tokens.USDC.on(Gnosis.CHAIN_ID)
          expectTokenMatches(token, Gnosis.USDC)
        })

        it('should return token for Sonic', () => {
          const token = Tokens.USDC.on(Sonic.CHAIN_ID)
          expectTokenMatches(token, Sonic.USDC)
        })
      })

      describe('when token is not supported on chain', () => {
        it('should throw an error', () => {
          expect(() => {
            Tokens.USDC.on(BaseSepolia.CHAIN_ID)
          }).toThrow()
        })
      })
    })
  })
})
