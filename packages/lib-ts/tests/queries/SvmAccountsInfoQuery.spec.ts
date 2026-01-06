import { SerializableSvmAccountsInfoQueryResult, SvmAccountsInfoQueryResponse } from '../../src/queries'
import { BigInt, SerializableSvmAccountInfo } from '../../src/types'
import { randomHex, randomSvmAddress } from '../helpers'

describe('SvmAccountsInfoQueryResponse', () => {
  describe('toResult', () => {
    describe('when response is successful', () => {
      describe('when data is provided', () => {
        it('should return result with transformed data', () => {
          const owner = randomSvmAddress().toBase58String()
          const lamports = BigInt.fromI32(1000000).toString()
          const accountData = randomHex(8)
          const rentEpoch = BigInt.fromI32(1844674407).toString()
          const executable = 'false'
          const slot = BigInt.fromI32(1234567890).toString()

          const serializableAccountInfo = new SerializableSvmAccountInfo(
            owner,
            lamports,
            accountData,
            rentEpoch,
            executable
          )
          const serializableData = new SerializableSvmAccountsInfoQueryResult([serializableAccountInfo], slot)
          const response = new SvmAccountsInfoQueryResponse('true', serializableData, '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const data = result.unwrap()
          expect(data.slot).toBe(slot)
          expect(data.accountsInfo.length).toBe(1)
          expect(data.accountsInfo[0].owner).toBe(owner)
          expect(data.accountsInfo[0].lamports).toBe(lamports)
          expect(data.accountsInfo[0].executable).toBe(false)
        })
      })
    })

    describe('when response is not successful', () => {
      describe('when error message is provided', () => {
        it('should return error with provided message', () => {
          const errorMessage = 'SVM accounts info query failed'
          const response = new SvmAccountsInfoQueryResponse(
            'false',
            new SerializableSvmAccountsInfoQueryResult([], '0'),
            errorMessage
          )
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new SvmAccountsInfoQueryResponse(
            'false',
            new SerializableSvmAccountsInfoQueryResult([], '0'),
            ''
          )
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting SVM accounts info')
        })
      })
    })
  })
})
