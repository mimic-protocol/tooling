import { environment } from '../src/environment'
import { MIMIC_HELPER_ADDRESS } from '../src/helpers'
import { Address, ChainId } from '../src/types'

import { randomSvmAddress, setContractCall, setEvmDecode, setEvmEncode } from './helpers'

describe('environment', () => {
  describe('getNativeTokenBalance', () => {
    describe('when chainId is evm', () => {
      const address = '0x9b6c444f5bbfe10680fb015e1a23bfc6193ae163'
      const chainId = ChainId.OPTIMISM

      beforeEach(() => {
        setEvmEncode('address', address, '0x0')
      })

      describe('when the evm call is an error', () => {
        it('throws an error', () => {
          const result = environment.getNativeTokenBalance(chainId, Address.fromHexString(address))
          expect(result.isError).toBe(true)
        })
      })

      describe('when evm call is successful', () => {
        beforeEach(() => {
          setContractCall(MIMIC_HELPER_ADDRESS, chainId, '0xeffd663c0x0', '0x100')
          setEvmDecode('uint256', '0x100', '100')
        })

        it('returns the decoded value', () => {
          const result = environment.getNativeTokenBalance(chainId, Address.fromHexString(address))
          expect(result.isError).toBe(false)
          expect(result.unwrap().toString()).toBe('100')
        })
      })
    })

    describe('when chainId is solana', () => {
      it('should throw an error', () => {
        const result = environment.getNativeTokenBalance(ChainId.SOLANA_MAINNET, randomSvmAddress())
        expect(result.isError).toBe(true)
        expect(result.error).toBe('Solana not supported')
      })
    })
  })
})
