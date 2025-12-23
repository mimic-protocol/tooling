import { Stringable } from '../../src/helpers'
import { Result } from '../../src/types'

class TestError implements Stringable {
  constructor(private readonly message: string) {}

  toString(): string {
    return this.message
  }
}

let fallbackCalls: i32 = 0
const fallback: () => i32 = () => ++fallbackCalls

beforeEach(() => {
  fallbackCalls = 0
})

describe('Result', () => {
  describe('ok', () => {
    describe('when a value is provided', () => {
      it('creates a successful result', () => {
        const result = Result.ok<i32, TestError>(42)

        expect(result.isOk).toBe(true)
        expect(result.isError).toBe(false)
        expect(result.unwrap()).toBe(42)
      })
    })
  })

  describe('err', () => {
    describe('when an error is provided', () => {
      it('creates an error result', () => {
        const error = new TestError('error message')
        const result = Result.err<i32, TestError>(error)

        expect(result.isOk).toBe(false)
        expect(result.isError).toBe(true)
        expect(result.error.toString()).toBe(error.toString())
      })
    })
  })

  describe('unwrap', () => {
    describe('when result is successful', () => {
      it('returns the contained value', () => {
        const result = Result.ok<string, TestError>('value')

        expect(result.unwrap()).toBe('value')
      })
    })

    describe('when result is an error', () => {
      it('throws the error string', () => {
        expect(() => {
          Result.err<string, TestError>(new TestError('error message')).unwrap()
        }).toThrow('error message')
      })
    })
  })

  describe('unwrapOr', () => {
    describe('when result is successful', () => {
      it('returns the contained value', () => {
        const result = Result.ok<string, TestError>('value')

        expect(result.unwrapOr('default')).toBe('value')
      })
    })

    describe('when result is an error', () => {
      it('returns the provided default value', () => {
        const result = Result.err<string, TestError>(new TestError('error message'))

        expect(result.unwrapOr('default')).toBe('default')
      })
    })
  })

  describe('unwrapOrElse', () => {
    describe('when result is successful', () => {
      it('returns the contained value without calling the fallback', () => {
        const result = Result.ok<i32, TestError>(7)

        const value = result.unwrapOrElse(fallback)

        expect(value).toBe(7)
        expect(fallbackCalls).toBe(0)
      })
    })

    describe('when result is an error', () => {
      it('calls the fallback and returns its value', () => {
        const result = Result.err<i32, TestError>(new TestError('error message'))

        const value = result.unwrapOrElse(fallback)

        expect(value).toBe(1)
        expect(fallbackCalls).toBe(1)
      })
    })
  })

  describe('error getter', () => {
    describe('when result is successful', () => {
      it('throws when accessing the error value', () => {
        expect(() => {
          Result.ok<string, TestError>('value').error
        }).toThrow('Trying to get an error from a successful result')
      })
    })

    describe('when result is an error', () => {
      it('returns the contained error', () => {
        const error = new TestError('error message')
        const result = Result.err<string, TestError>(error)

        expect(result.error.toString()).toBe(error.toString())
      })
    })
  })
})
