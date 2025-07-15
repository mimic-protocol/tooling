import { NATIVE_ADDRESS } from '../../src/helpers'
import { Token } from '../../src/tokens'
import { ChainId } from '../../src/types'
import { randomAddress, randomToken, setContractCall, setEvmDecode } from '../helpers'

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

  describe('when it is a native token', () => {
    it('respects the user parameters if add them', () => {
      const token = Token.fromAddress(randomAddress(), 1, 6, 'USDC')
      expect('USDC').toBe(token.symbol)
      expect(6).toBe(token.decimals)
    })

    it('populates the symbol and decimal if missing', () => {
      const token = Token.fromString(NATIVE_ADDRESS, 1)
      expect('ETH').toBe(token.symbol)
      expect(18).toBe(token.decimals)
    })

    it('populates the symbol if missing', () => {
      const token = Token.fromString(NATIVE_ADDRESS, 1, 18)
      expect('ETH').toBe(token.symbol)
    })

    it('populates the decimals if missing', () => {
      const token = Token.fromString(NATIVE_ADDRESS, 1, Token.EMPTY_DECIMALS, 'ETH')
      expect(18).toBe(token.decimals)
    })
  })

  describe('when token does not have decimals or symbol', () => {
    it('looks for the symbol on chain', () => {
      const token = Token.fromAddress(randomAddress(), 1)
      setContractCall(token.address.toHexString(), token.chainId, '0x95d89b41', '0x123')
      setEvmDecode('string', '0x123', 'ETH')
      expect('ETH').toBe(token.symbol)
    })

    it('uses the cache to get the symbol if it already looked for it', () => {
      const token = Token.fromAddress(randomAddress(), 1)
      setContractCall(token.address.toHexString(), token.chainId, '0x95d89b41', '0x123')
      setEvmDecode('string', '0x123', 'ETH')
      expect('ETH').toBe(token.symbol)
      setEvmDecode('string', '0x123', 'ETH1')
      expect('ETH').toBe(token.symbol)
    })

    it('uses the cache if it was created with a symbol', () => {
      const token = Token.fromAddress(randomAddress(), 1, Token.EMPTY_DECIMALS, 'USDC')
      expect('USDC').toBe(token.symbol)
    })

    it('looks for the decimals on chain', () => {
      const token = Token.fromAddress(randomAddress(), 1)
      setContractCall(token.address.toHexString(), token.chainId, '0x313ce567', '0x123')
      setEvmDecode('uint8', '0x123', '18')
      expect(18).toBe(token.decimals)
    })

    it('uses the cache to get the decimals if it already looked for it', () => {
      const token = Token.fromAddress(randomAddress(), 1)
      setContractCall(token.address.toHexString(), token.chainId, '0x313ce567', '0x123')
      setEvmDecode('uint8', '0x123', '18')
      expect(18).toBe(token.decimals)
      setEvmDecode('uint8', '0x123', '18')
      expect(18).toBe(token.decimals)
    })

    it('uses the cache if it was created with decimals', () => {
      const token = Token.fromAddress(randomAddress(), 1, 6)
      expect(6).toBe(token.decimals)
    })
  })

  describe('native', () => {
    describe('when the chain id is ethereum', () => {
      const chainId = ChainId.ETHEREUM

      it('returns the expected token', () => {
        const token = Token.native(chainId)

        expect(token.address.toHexString()).toBe(NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is base', () => {
      const chainId = ChainId.BASE

      it('returns the expected token', () => {
        const token = Token.native(chainId)

        expect(token.address.toHexString()).toBe(NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is arbitrum', () => {
      const chainId = ChainId.ARBITRUM

      it('returns the expected token', () => {
        const token = Token.native(chainId)

        expect(token.address.toHexString()).toBe(NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is optimism', () => {
      const chainId = ChainId.OPTIMISM

      it('returns the expected token', () => {
        const token = Token.native(chainId)

        expect(token.address.toHexString()).toBe(NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is gnosis', () => {
      const chainId = ChainId.GNOSIS

      it('returns the expected token', () => {
        const token = Token.native(chainId)

        expect(token.address.toHexString()).toBe(NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('xDAI')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is unknown', () => {
      it('throws an error', () => {
        expect(() => {
          Token.native(changetype<ChainId>(9999))
        }).toThrow()
      })
    })
  })

  describe('equals', () => {
    describe('when comparing two tokens', () => {
      describe('when using the same chain', () => {
        const chainId: ChainId = ChainId.ETHEREUM

        it('returns true for tokens with the same address and chainId', () => {
          const address = randomAddress()
          const token1 = Token.fromAddress(address, chainId, 18, 'TOKEN1')
          const token2 = Token.fromAddress(address, chainId, 6, 'TOKEN2')

          expect(token1.equals(token2)).toBe(true)
        })

        it('returns false for tokens with different addresses', () => {
          const token1 = Token.fromAddress(randomAddress(), chainId, 18, 'TOKEN')
          const token2 = Token.fromAddress(randomAddress(), chainId, 18, 'TOKEN')

          expect(token1.equals(token2)).toBe(false)
        })
      })

      describe('when using different chains', () => {
        it('returns false for tokens with different chainIds', () => {
          const address = randomAddress()
          const token1 = Token.fromAddress(address, ChainId.ETHEREUM, 18, 'TOKEN')
          const token2 = Token.fromAddress(address, ChainId.OPTIMISM, 18, 'TOKEN')

          expect(token1.equals(token2)).toBe(false)
        })
      })
    })
  })
})
