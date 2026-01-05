import { EvmCallQueryResponse } from '../../src/queries'

describe('EvmCallQueryResponse', () => {
  describe('toResult', () => {
    describe('when response is successful', () => {
      describe('when data is provided', () => {
        it('should return result with data', () => {
          const responseData = '0x' + '0'.repeat(62) + '64'
          const response = new EvmCallQueryResponse('true', responseData, '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const data = result.unwrap()
          expect(data).toBe(responseData)
        })
      })

      describe('when data is empty', () => {
        it('should return empty string', () => {
          const response = new EvmCallQueryResponse('true', '', '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const data = result.unwrap()
          expect(data).toBe('')
        })
      })
    })

    describe('when response is not successful', () => {
      describe('when error message is provided', () => {
        it('should return error with provided message', () => {
          const errorMessage = 'Contract call failed'
          const response = new EvmCallQueryResponse('false', '', errorMessage)
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new EvmCallQueryResponse('false', '', '')
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting evm call')
        })
      })
    })
  })
})
