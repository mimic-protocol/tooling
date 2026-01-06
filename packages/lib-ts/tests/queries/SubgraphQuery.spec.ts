import { SubgraphQueryResponse, SubgraphQueryResult } from '../../src/queries'

describe('SubgraphQueryResponse', () => {
  describe('toResult', () => {
    describe('when response is successful', () => {
      describe('when data is provided', () => {
        it('should return result with data', () => {
          const resultData = new SubgraphQueryResult(1234567890, '{"key": "value"}')
          const response = new SubgraphQueryResponse('true', resultData, '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const data = result.unwrap()
          expect(data.blockNumber).toBe(1234567890)
          expect(data.data).toBe('{"key": "value"}')
        })
      })
    })

    describe('when response is not successful', () => {
      describe('when error message is provided', () => {
        it('should return error with provided message', () => {
          const errorMessage = 'Subgraph query failed'
          const response = new SubgraphQueryResponse('false', new SubgraphQueryResult(0, ''), errorMessage)
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new SubgraphQueryResponse('false', new SubgraphQueryResult(0, ''), '')
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting subgraph query')
        })
      })
    })
  })
})
