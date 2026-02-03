import { MIMIC_HELPER_ADDRESS } from '../../src/helpers'
import { storage } from '../../src/storage'
import { Address, Bytes, ChainId } from '../../src/types'
import { setContractCall, setEvmDecode, setEvmEncode } from '../helpers'

describe('storage', () => {
  const smartAccount = '0x9b6c444f5bbfe10680fb015e1a23bfc6193ae163'
  const key = 'test-key'

  describe('getData', () => {
    beforeEach(() => {
      setEvmEncode('address', smartAccount, '0x01')
      setEvmEncode('string', key, '0x01')
    })

    describe('when the evm call is an error', () => {
      it('throws an error', () => {
        const result = storage.getData(Address.fromHexString(smartAccount), key)
        expect(result.isError).toBe(true)
      })
    })

    describe('when evm call is successful', () => {
      beforeEach(() => {
        setContractCall(MIMIC_HELPER_ADDRESS, ChainId.OPTIMISM, '0x53f71fd30x01', '0x10')
        setEvmDecode('bytes', '0x10', Bytes.fromUTF8('test string').toHexString())
      })

      it('returns the byte data', () => {
        const result = storage.getData(Address.fromHexString(smartAccount), key)
        expect(result.isError).toBe(false)
        expect(result.unwrap().toString()).toBe('test string')
      })
    })
  })
})
