import { SVM_NATIVE_ADDRESS } from '../../src/helpers'
import { SPLToken } from '../../src/tokens/SPLToken'
import { Address, ChainId, SvmFindProgramAddressParams, SvmPdaSeed, SvmTokenMetadataData } from '../../src/types'
import { randomEvmAddress, randomHex, randomSvmAddress, setFindProgramAddress, setGetAccountsInfo } from '../helpers'

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
        const token = SPLToken.fromAddress(address, ChainId.SOLANA_MAINNET, 6, 'USDC')

        expect(token.address.toString()).toBe(address.toString())
        expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
        expect(token.decimals).toBe(6)
        expect(token.symbol).toBe('USDC')
      })
    })

    describe('when the address is not SVM', () => {
      it('fails to create the token', () => {
        expect(() => {
          SPLToken.fromAddress(randomEvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')
        }).toThrow()
      })
    })
  })

  describe('fromString', () => {
    describe('when the address is SVM', () => {
      it('creates the token', () => {
        const address = randomSvmAddress().toString()
        const token = SPLToken.fromString(address, ChainId.SOLANA_MAINNET, 6, 'USDC')

        expect(token.address.toString()).toBe(address)
        expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
        expect(token.decimals).toBe(6)
        expect(token.symbol).toBe('USDC')
      })
    })

    describe('when the address is not SVM', () => {
      it('fails to create the token', () => {
        expect(() => {
          SPLToken.fromString(randomEvmAddress().toString(), ChainId.SOLANA_MAINNET, 6, 'USDC')
        }).toThrow()
      })
    })

    describe('when the address is invalid', () => {
      it('faisl to create the token', () => {
        const address = 'invalid address'
        expect(() => {
          SPLToken.fromString(address, ChainId.SOLANA_MAINNET, 6, 'USDC')
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
      const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

      expect(token.chainId).toBe(ChainId.SOLANA_MAINNET)
    })
  })

  describe('symbol', () => {
    it('returns SOL when native', () => {
      const token = SPLToken.native()

      expect(token.symbol).toBe('SOL')
    })

    it('returns decoded when SPL and has metadata', () => {
      const addr = randomSvmAddress()
      const token = SPLToken.fromAddress(addr)
      const metadataAddr = randomSvmAddress()

      const params = new SvmFindProgramAddressParams(
        [
          SvmPdaSeed.fromString('metadata'),
          SvmPdaSeed.from(Address.fromString(SvmTokenMetadataData.METADATA_PROGRAM_ID)),
          SvmPdaSeed.from(addr),
        ],
        SvmTokenMetadataData.METADATA_PROGRAM_ID
      )
      const result = `{"address":"${metadataAddr.toString()}","bump":255}`

      const emptyStrHex = '00000000'
      const mimicHex = '05000000' + '4d494d4943'
      setFindProgramAddress(params.seeds, Address.fromBase58String(params.programId), result)
      setGetAccountsInfo(
        `${metadataAddr.toString()}`,
        `{
          "accountsInfo": [
            {
              "executable": false,
              "rentEpoch": "1234",
              "owner": "${randomSvmAddress()}",
              "lamports": "100",
              "data":"${randomHex(130)}${emptyStrHex}${mimicHex}${emptyStrHex}"
            }
          ],
          "slot":"12345678"
        }`
      )

      expect(token.symbol).toBe('MIMIC')
    })

    it('returns token address abbreviation when SPL and no metadata', () => {
      const addr = randomSvmAddress()
      const token = SPLToken.fromAddress(addr)
      const metadataAddr = randomSvmAddress()

      const params = new SvmFindProgramAddressParams(
        [
          SvmPdaSeed.fromString('metadata'),
          SvmPdaSeed.from(Address.fromString(SvmTokenMetadataData.METADATA_PROGRAM_ID)),
          SvmPdaSeed.from(addr),
        ],
        SvmTokenMetadataData.METADATA_PROGRAM_ID
      )
      const result = `{"address":"${metadataAddr.toString()}","bump":255}`

      setFindProgramAddress(params.seeds, Address.fromBase58String(params.programId), result)
      // In reality, the svmAccountsInfoQuery returns null and then a default value with data "0x". But this is easier to mock
      setGetAccountsInfo(
        `${metadataAddr.toString()}`,
        `{
          "accountsInfo": [
            {
              "executable": false,
              "rentEpoch": "1234",
              "owner": "${randomSvmAddress()}",
              "lamports": "100",
              "data":"0x"
            }
          ],
          "slot":"12345678"
        }`
      )

      expect(token.symbol).toBe(`${addr.toString().slice(0, 5)}...${addr.toString().slice(-5)}`)
    })
  })

  describe('decimals', () => {
    it('returns 9 when native', () => {
      const token = SPLToken.native()

      expect(token.decimals).toBe(9)
    })

    it('returns set decimals when SPL and set', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

      expect(token.decimals).toBe(6)
    })

    it('returns queried decimals when SPL and not set - USDC', () => {
      const addr = randomSvmAddress()
      setGetAccountsInfo(
        `${addr.toString()}`,
        `{
          "accountsInfo": [
            {
              "executable": false,
              "rentEpoch": "1234",
              "owner": "${randomSvmAddress()}",
              "lamports": "100",
              "data":"0x0100000098fe86e88d9be2ea8bc1cca4878b2988c240f52b8424bfb40ed1a2ddcb5e199b25dd8d661f3620000601010000006270aa8a59c59405b45286c86772e6cd126e9b8a5d3a38536d37f7b414e8b667"
            }
          ],
          "slot":"12345678"
        }`
      )
      const token = SPLToken.fromAddress(addr)
      expect(token.decimals).toBe(6)
    })

    it('returns queried decimals when SPL and not set - BONK', () => {
      const addr = randomSvmAddress()
      setGetAccountsInfo(
        `${addr.toString()}`,
        `{
          "accountsInfo": [
            {
              "executable": false,
              "rentEpoch": "1234",
              "owner": "${randomSvmAddress()}",
              "lamports": "100",
              "data":"0x0000000079595167da480c5ae1344501d211b7736340e3fbdf00ecde63b64dc88acc2f1c292e864bbf381e7a0501000000000000000000000000000000000000000000000000000000000000000000000000"
            }
          ],
          "slot":"12345678"
        }`
      )
      const token = SPLToken.fromAddress(addr)
      expect(token.decimals).toBe(5)
    })
  })

  describe('equals', () => {
    it('returns true when tokens have the same address', () => {
      const address = randomSvmAddress()
      const tokenA = SPLToken.fromAddress(address, ChainId.SOLANA_MAINNET, 6, 'USDC')
      const tokenB = SPLToken.fromAddress(address, ChainId.SOLANA_MAINNET, 6, 'USDC')

      expect(tokenA.equals(tokenB)).toBe(true)
    })

    it('returns false when tokens have a different address', () => {
      const tokenA = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')
      const tokenB = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDT')

      expect(tokenA.equals(tokenB)).toBe(false)
    })
  })

  describe('isUSD', () => {
    it('returns false when native', () => {
      const token = SPLToken.native()

      expect(token.isUSD()).toBe(false)
    })

    it('returns false when SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

      expect(token.isUSD()).toBe(false)
    })
  })

  describe('isNative', () => {
    it('returns true when native', () => {
      const token = SPLToken.native()

      expect(token.isNative()).toBe(true)
    })

    it('returns false when SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

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
        expect(token.hasChain(ChainId.BASE_SEPOLIA)).toBe(false)
        expect(token.hasChain(ChainId.ETHEREUM)).toBe(false)
        expect(token.hasChain(ChainId.GNOSIS)).toBe(false)
        expect(token.hasChain(ChainId.OPTIMISM)).toBe(false)
      })
    })

    describe('when SPL', () => {
      it('returns true for Solana chainId', () => {
        const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

        expect(token.hasChain(ChainId.SOLANA_MAINNET)).toBe(true)
      })

      it('returns false for other chainId', () => {
        const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

        expect(token.hasChain(ChainId.ARBITRUM)).toBe(false)
        expect(token.hasChain(ChainId.BASE)).toBe(false)
        expect(token.hasChain(ChainId.BASE_SEPOLIA)).toBe(false)
        expect(token.hasChain(ChainId.ETHEREUM)).toBe(false)
        expect(token.hasChain(ChainId.GNOSIS)).toBe(false)
        expect(token.hasChain(ChainId.OPTIMISM)).toBe(false)
      })
    })
  })

  describe('toString', () => {
    it('returns SOL for native', () => {
      const token = SPLToken.native()

      expect(token.toString()).toBe('Token ' + token.address.toString() + ' on chain 507424 (SOL)')
    })

    it('returns symbol for SPL', () => {
      const token = SPLToken.fromAddress(randomSvmAddress(), ChainId.SOLANA_MAINNET, 6, 'USDC')

      expect(token.toString()).toBe('Token ' + token.address.toString() + ' on chain 507424 (USDC)')
    })
  })
})
