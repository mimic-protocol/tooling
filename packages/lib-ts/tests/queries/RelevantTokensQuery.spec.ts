import { RelevantTokensQueryResponse, RelevantTokensQueryResult } from '../../src/queries'
import { createTestBalance, randomChainId } from '../helpers'

describe('RelevantTokensQueryResponse', () => {
  describe('toResult', () => {
    describe('when response is successful', () => {
      describe('when data has multiple results', () => {
        it('should return balances array with correct values', () => {
          const chainId = randomChainId()
          const testBalance1 = createTestBalance(1, chainId)
          const testBalance2 = createTestBalance(2, chainId)

          const result1 = new RelevantTokensQueryResult(1234567890, [testBalance1.balance, testBalance2.balance])
          const result2 = new RelevantTokensQueryResult(1234567891, [testBalance1.balance])

          const response = new RelevantTokensQueryResponse('true', [result1, result2], '')
          const responseResult = response.toResult()

          expect(responseResult.isOk).toBe(true)
          const balances = responseResult.unwrap()
          expect(balances.length).toBe(2)
          expect(balances[0].length).toBe(2)
          expect(balances[1].length).toBe(1)
          expect(balances[0][0].token.address).toBe(testBalance1.token.address.toString())
          expect(balances[0][1].token.address).toBe(testBalance2.token.address.toString())
        })
      })

      describe('when data is empty', () => {
        it('should return empty balances array', () => {
          const response = new RelevantTokensQueryResponse('true', [], '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const balances = result.unwrap()
          expect(balances.length).toBe(0)
        })
      })

      describe('when data has empty balances', () => {
        it('should return array with empty balance arrays', () => {
          const result1 = new RelevantTokensQueryResult(1234567890, [])
          const result2 = new RelevantTokensQueryResult(1234567891, [])

          const response = new RelevantTokensQueryResponse('true', [result1, result2], '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const balances = result.unwrap()
          expect(balances.length).toBe(2)
          expect(balances[0].length).toBe(0)
          expect(balances[1].length).toBe(0)
        })
      })
    })

    describe('when response is not successful', () => {
      describe('when error message is provided', () => {
        it('should return error with provided message', () => {
          const errorMessage = 'Address not found'
          const response = new RelevantTokensQueryResponse('false', [], errorMessage)
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new RelevantTokensQueryResponse('false', [], '')
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting relevant tokens')
        })
      })
    })
  })
})
