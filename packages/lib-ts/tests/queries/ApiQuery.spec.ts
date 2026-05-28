import { ApiQueryResponse } from '../../src/queries'

describe('ApiQueryResponse', () => {
  describe('toResult', () => {
    describe('when response is successful', () => {
      describe('when data is provided', () => {
        it('should return result with data', () => {
          const responseData = '{"test": true}'
          const response = new ApiQueryResponse('true', responseData, '')
          const result = response.toResult()

          expect(result.isOk).toBe(true)
          const data = result.unwrap()
          expect(data).toBe(responseData)
        })
      })

      describe('when data is empty', () => {
        it('should return empty string', () => {
          const response = new ApiQueryResponse('true', '', '')
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
          const errorMessage = 'Something went wrong'
          const response = new ApiQueryResponse('false', '', errorMessage)
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new ApiQueryResponse('false', '', '')
          const result = response.toResult()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting API response')
        })
      })
    })
  })
})
