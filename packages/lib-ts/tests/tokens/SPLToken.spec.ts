import { SVM_NATIVE_ADDRESS } from '../../src/helpers'
import { SPLToken } from '../../src/tokens/SPLToken'
import { ChainId } from '../../src/types'
import { randomEvmAddress, randomSvmAddress } from '../helpers'

describe('SPLToken', () => {
  describe('native', () => {
    it('returns the SOL token', () => {
      const token = SPLToken.native()

      expect(token.address.toString()).toBe(SVM_NATIVE_ADDRESS)
      expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
      expect(token.decimals).toBe(9)
      expect(token.symbol).toBe('SOL')
    })
  })

  describe('fromAddress', () => {
    describe('when the address is SVM', () => {
      it('creates the token', () => {
        const address = randomSvmAddress()
        const token = SPLToken.fromAddress(address, 6, 'USDC')

        expect(token.address.toString()).toBe(address.toString())
        expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
        expect(token.decimals).toBe(6)
        expect(token.symbol).toBe('USDC')
      })
    })

    describe('when the address is not SVM', () => {
      it('fails to create the token', () => {
        expect(() => {
          SPLToken.fromAddress(randomEvmAddress(), 6, 'USDC')
        }).toThrow()
      })
    })
  })

  describe('fromString', () => {
    describe('when the address is SVM', () => {
      it('creates the token', () => {
        const address = randomSvmAddress().toString()
        const token = SPLToken.fromString(address, 6, 'USDC')

        expect(token.address.toString()).toBe(address)
        expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
        expect(token.decimals).toBe(6)
        expect(token.symbol).toBe('USDC')
      })
    })

    describe('when the address is not SVM', () => {
      it('fails to create the token', () => {
        expect(() => {
          SPLToken.fromString(randomEvmAddress().toString(), 6, 'USDC')
        }).toThrow()
      })
    })

    describe('when the address is invalid', () => {
      it('faisl to create the token', () => {
        const address = 'invalid address'
        expect(() => {
          SPLToken.fromString(address, 6, 'USDC')
        }).toThrow()
      })
    })
  })

  describe('chainId', () => {
    it('returns Solana chainId when native', () => {
      const token = SPLToken.native()

      expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
    })

    it('returns Solana chainId when SPL token', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

      expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
    })
  })

  describe('symbol', () => {
    it('returns SOL when native', () => {
      const token = SPLToken.native()

      expect(token.symbol).toBe('SOL')
    })

    it('returns set symbol when SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

      expect(token.symbol).toBe('USDC')
    })
  })

  describe('decimals', () => {
    it('returns 9 when native', () => {
      const token = SPLToken.native()

      expect(token.decimals).toBe(9)
    })

    it('returns set decimals when SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

      expect(token.decimals).toBe(6)
    })
  })

  describe('equals', () => {
    it('returns true when tokens have the same address', () => {
      const address = randomSvmAddress()
      const tokenA = SPLToken.fromAddress(address, 6, 'USDC')
      const tokenB = SPLToken.fromAddress(address, 6, 'USDC')

      expect(tokenA.equals(tokenB)).toBe(true)
    })

    it('returns false when tokens have a different address', () => {
      const tokenA = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')
      const tokenB = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDT')

      expect(tokenA.equals(tokenB)).toBe(false)
    })
  })

  describe('isUSD', () => {
    it('returns false when native', () => {
      const token = SPLToken.native()

      expect(token.isUSD()).toBe(false)
    })

    it('returns false when SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

      expect(token.isUSD()).toBe(false)
    })
  })

  describe('isNative', () => {
    it('returns true when native', () => {
      const token = SPLToken.native()

      expect(token.isNative()).toBe(true)
    })

    it('returns false when SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

      expect(token.isNative()).toBe(false)
    })
  })

  describe('hasChain', () => {
    describe('when native', () => {
      it('returns true for Solana chainId', () => {
        const token = SPLToken.native()

        expect(token.hasChain(ChainId.SOLANA_MAINNET)).toBe(true)
      })

      it('returns false for other chainId', () => {
        const token = SPLToken.native()

        expect(token.hasChain(ChainId.ARBITRUM)).toBe(false)
        expect(token.hasChain(ChainId.BASE)).toBe(false)
        expect(token.hasChain(ChainId.ETHEREUM)).toBe(false)
        expect(token.hasChain(ChainId.GNOSIS)).toBe(false)
        expect(token.hasChain(ChainId.OPTIMISM)).toBe(false)
      })
    })

    describe('when SPL', () => {
      it('returns true for Solana chainId', () => {
        const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

        expect(token.hasChain(ChainId.SOLANA_MAINNET)).toBe(true)
      })

      it('returns false for other chainId', () => {
        const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

        expect(token.hasChain(ChainId.ARBITRUM)).toBe(false)
        expect(token.hasChain(ChainId.BASE)).toBe(false)
        expect(token.hasChain(ChainId.ETHEREUM)).toBe(false)
        expect(token.hasChain(ChainId.GNOSIS)).toBe(false)
        expect(token.hasChain(ChainId.OPTIMISM)).toBe(false)
      })
    })
  })

  describe('toString', () => {
    it('returns SOL for native', () => {
      const token = SPLToken.native()

      expect(token.toString()).toBe('SOL')
    })

    it('returns symbol for SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')

      expect(token.toString()).toBe(token.symbol)
    })
  })
})
