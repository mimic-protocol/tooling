import { EVM_NATIVE_ADDRESS } from '../../src/helpers'
import { DenominationToken, ERC20Token } from '../../src/tokens'
import { Address, ChainId } from '../../src/types'
import { randomERC20Token, randomEvmAddress, setContractCall, setEvmDecode } from '../helpers'

describe('ERC20Token', () => {
  describe('create', () => {
    describe('when the address is the native address', () => {
      it('populates the symbol and decimal if missing', () => {
        const token = ERC20Token.fromString(EVM_NATIVE_ADDRESS, 1)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })

      it('populates the symbol if missing', () => {
        const token = ERC20Token.fromString(EVM_NATIVE_ADDRESS, 1, 18)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })

      it('populates the decimals if missing', () => {
        const token = ERC20Token.fromString(EVM_NATIVE_ADDRESS, 1, ERC20Token.EMPTY_DECIMALS, 'ETH')
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the address is not the native address', () => {
      it('looks for the symbol on chain', () => {
        const token = ERC20Token.fromAddress(randomEvmAddress(), 1)
        setContractCall(token.address.toHexString(), token.chainId, '0x95d89b41', '0x123')
        setEvmDecode('string', '0x123', 'ETH')
        expect(token.symbol).toBe('ETH')
      })

      it('uses the cache to get the symbol if it already looked for it', () => {
        const token = ERC20Token.fromAddress(randomEvmAddress(), 1)
        setContractCall(token.address.toHexString(), token.chainId, '0x95d89b41', '0x123')
        setEvmDecode('string', '0x123', 'ETH')
        expect(token.symbol).toBe('ETH')
        setEvmDecode('string', '0x123', 'ETH1')
        expect(token.symbol).toBe('ETH')
      })

      it('uses the cache if it was created with a symbol', () => {
        const token = ERC20Token.fromAddress(randomEvmAddress(), 1, ERC20Token.EMPTY_DECIMALS, 'USDC')
        expect(token.symbol).toBe('USDC')
      })

      it('looks for the decimals on chain', () => {
        const token = ERC20Token.fromAddress(randomEvmAddress(), 1)
        setContractCall(token.address.toHexString(), token.chainId, '0x313ce567', '0x123')
        setEvmDecode('uint8', '0x123', '18')
        expect(token.decimals).toBe(18)
      })

      it('uses the cache to get the decimals if it already looked for it', () => {
        const token = ERC20Token.fromAddress(randomEvmAddress(), 1)
        setContractCall(token.address.toHexString(), token.chainId, '0x313ce567', '0x123')
        setEvmDecode('uint8', '0x123', '18')
        expect(token.decimals).toBe(18)
        setEvmDecode('uint8', '0x123', '18')
        expect(token.decimals).toBe(18)
      })

      it('uses the cache if it was created with decimals', () => {
        const token = ERC20Token.fromAddress(randomEvmAddress(), 1, 6)
        expect(token.decimals).toBe(6)
      })
    })
  })

  describe('native', () => {
    describe('when the chain id is ethereum', () => {
      const chainId = ChainId.ETHEREUM

      it('returns the expected token', () => {
        const token = ERC20Token.native(chainId)

        expect(token.address.toHexString()).toBe(EVM_NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is base', () => {
      const chainId = ChainId.BASE

      it('returns the expected token', () => {
        const token = ERC20Token.native(chainId)

        expect(token.address.toHexString()).toBe(EVM_NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is arbitrum', () => {
      const chainId = ChainId.ARBITRUM

      it('returns the expected token', () => {
        const token = ERC20Token.native(chainId)

        expect(token.address.toHexString()).toBe(EVM_NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is optimism', () => {
      const chainId = ChainId.OPTIMISM

      it('returns the expected token', () => {
        const token = ERC20Token.native(chainId)

        expect(token.address.toHexString()).toBe(EVM_NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('ETH')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is gnosis', () => {
      const chainId = ChainId.GNOSIS

      it('returns the expected token', () => {
        const token = ERC20Token.native(chainId)

        expect(token.address.toHexString()).toBe(EVM_NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('xDAI')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is sonic', () => {
      const chainId = ChainId.SONIC

      it('returns the expected token', () => {
        const token = ERC20Token.native(chainId)

        expect(token.address.toHexString()).toBe(EVM_NATIVE_ADDRESS)
        expect(token.chainId).toBe(chainId)
        expect(token.symbol).toBe('SONIC')
        expect(token.decimals).toBe(18)
      })
    })

    describe('when the chain id is unknown', () => {
      it('throws an error', () => {
        expect(() => {
          ERC20Token.native(changetype<ChainId>(9999))
        }).toThrow()
      })
    })
  })

  describe('address', () => {
    it('has an immutable address', () => {
      const token = randomERC20Token()
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
    describe('when querying the same chain', () => {
      it('returns true', () => {
        const token = ERC20Token.native(ChainId.ETHEREUM)
        expect(token.hasChain(ChainId.ETHEREUM)).toBe(true)
      })
    })

    describe('when querying another chain', () => {
      it('returns true', () => {
        const token = ERC20Token.native(ChainId.ETHEREUM)
        expect(token.hasChain(ChainId.OPTIMISM)).toBe(false)
      })
    })
  })

  describe('equals', () => {
    describe('when comparing two ERC20 tokens', () => {
      describe('when using the same chain', () => {
        const chainId: ChainId = ChainId.ETHEREUM

        it('returns true for tokens with the same address and chainId', () => {
          const address = randomEvmAddress()
          const token1 = ERC20Token.fromAddress(address, chainId, 18, 'TOKEN1')
          const token2 = ERC20Token.fromAddress(address, chainId, 6, 'TOKEN2')

          expect(token1.equals(token2)).toBe(true)
        })

        it('returns false for tokens with different addresses', () => {
          const token1 = ERC20Token.fromAddress(randomEvmAddress(), chainId, 18, 'TOKEN')
          const token2 = ERC20Token.fromAddress(randomEvmAddress(), chainId, 18, 'TOKEN')

          expect(token1.equals(token2)).toBe(false)
        })
      })

      describe('when using different chains', () => {
        it('returns false for tokens with different chainIds', () => {
          const address = randomEvmAddress()
          const token1 = ERC20Token.fromAddress(address, ChainId.ETHEREUM, 18, 'TOKEN')
          const token2 = ERC20Token.fromAddress(address, ChainId.OPTIMISM, 18, 'TOKEN')

          expect(token1.equals(token2)).toBe(false)
        })
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
})
