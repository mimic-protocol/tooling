import { join, NULL_ADDRESS, parseCSV, serialize, serializeArray } from '../../src/helpers'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomAddress, randomToken } from '../helpers'

describe('serialize', () => {
  describe('serialize', () => {
    describe('when passing an Address', () => {
      it('converts it to string correctly', () => {
        const address = Address.zero()
        const serialized = serialize(address)
        expect(serialized).toBe(NULL_ADDRESS)
      })
    })

    describe('when passing Bytes', () => {
      it('converts it to string correctly', () => {
        const bytes = Bytes.fromI32(5)
        const serialized = serialize(bytes)
        expect(serialized).toBe('0x05000000')
      })
    })

    describe('when passing a BigInt', () => {
      it('converts it to string correctly', () => {
        const bigInt = BigInt.fromI32(5)
        const serialized = serialize(bigInt)
        expect(serialized).toBe('BigInt(5)')
      })

      it('converts a negative BigInt to string correctly', () => {
        const bigInt = BigInt.fromI32(-5)
        const serialized = serialize(bigInt)
        expect(serialized).toBe('BigInt(-5)')
      })
    })

    describe('when passing a number', () => {
      it('converts it to string correctly', () => {
        const num = 5
        const serialized = serialize(num)
        expect(serialized).toBe('5')
      })
    })

    describe('when passing a Token', () => {
      it('converts it to string correctly', () => {
        const token = randomToken()
        const serialized = serialize(token)

        const address = token.address.toHexString()
        const chainId = token.chainId
        expect(serialized).toBe(`Token(${address},${chainId})`)
      })
    })

    describe('when passing a TokenAmount', () => {
      it('converts it to string correctly', () => {
        const token = randomToken()
        const amount = BigInt.fromI32(5)
        const tokenAmount = new TokenAmount(token, amount)
        const serialized = serialize(tokenAmount)

        const serializedToken = serialize(token)
        expect(serialized).toBe(`TokenAmount(${serializedToken},${amount.serialize()})`)
      })
    })
  })

  describe('join', () => {
    describe('when passing a list of strings', () => {
      it('returns them joined', () => {
        const joint = join(['one', 'two', 'three'])
        expect(joint).toBe('one,two,three')
      })
    })

    describe('when passing a list of nulls', () => {
      it('returns them joined', () => {
        const joint = join([null, null, null])
        expect(joint).toBe(',,')
      })
    })

    describe('when passing a mixed list', () => {
      it('returns them joined', () => {
        const joint = join(['one', null, 'three'])
        expect(joint).toBe('one,,three')
      })
    })
  })

  describe('serializeArray', () => {
    describe('when passing an array of Addresses', () => {
      it('converts it to string correctly', () => {
        const addresses = [Address.zero(), Address.zero()]
        const serialized = serializeArray(addresses)
        expect(serialized).toBe(`Array(${NULL_ADDRESS},${NULL_ADDRESS})`)
      })
    })

    describe('when passing an array of Bytes', () => {
      it('converts it to string correctly', () => {
        const bytesArray = [Bytes.fromI32(5), Bytes.fromI32(10)]
        const serialized = serializeArray(bytesArray)
        expect(serialized).toBe('Array(0x05000000,0x0a000000)')
      })
    })

    describe('when passing an array of BigInts', () => {
      it('converts it to string correctly', () => {
        const bigInts = [BigInt.fromI32(5), BigInt.fromI32(10)]
        const serialized = serializeArray(bigInts)
        expect(serialized).toBe('Array(BigInt(5),BigInt(10))')
      })
    })

    describe('when passing an array of numbers', () => {
      it('converts it to string correctly', () => {
        const numbers = [5, 10, 15]
        const serialized = serializeArray(numbers)
        expect(serialized).toBe('Array(5,10,15)')
      })
    })

    describe('when passing an empty array', () => {
      it('returns Array()', () => {
        const empty: number[] = []
        const serialized = serializeArray(empty)
        expect(serialized).toBe('Array()')
      })
    })
  })

  describe('parseCSV', () => {
    describe('when parsing a simple CSV string', () => {
      it('splits it into tokens correctly', () => {
        const list: (string | null)[] = ['one', 'two', 'three']
        const input = join(list)
        const result = parseCSV(input)

        expect(result.length).toBe(list.length)
        for (let i = 0; i < list.length; i++) {
          expect(result[i]).toBe(list[i])
        }
      })
    })

    describe('when parsing a CSV string with parentheses', () => {
      it('correctly handles nested structures', () => {
        const address = Address.fromString(randomAddress())
        const chainIds: u64[] = [1, 137]
        const bigInt = BigInt.fromI32(0)
        const zero = '0'

        const list: (string | null)[] = [
          serialize(address),
          serializeArray(chainIds),
          serialize(bigInt),
          serialize(zero),
        ]
        const input = join(list)
        const result = parseCSV(input)

        expect(result.length).toBe(list.length)
        for (let i = 0; i < list.length; i++) {
          expect(result[i]).toBe(list[i])
        }
      })
    })

    describe('when parsing a CSV string with complex nested structures', () => {
      it('preserves the nested commas', () => {
        const token = randomToken()
        const amount = BigInt.fromI32(100)
        const tokenAmount = new TokenAmount(token, amount)
        const list: (string | null)[] = [serialize(token), serialize(amount), serialize(tokenAmount)]
        const input = join(list)
        const result = parseCSV(input)

        expect(result.length).toBe(list.length)
        for (let i = 0; i < list.length; i++) {
          expect(result[i]).toBe(list[i])
        }
      })
    })

    describe('when parsing a string with unbalanced parentheses', () => {
      it('throws an error for opening parenthesis without closing', () => {
        expect(() => {
          const input = 'one,(two,three'
          parseCSV(input)
        }).toThrow()
        expect(() => {
          const input = 'on(e,(two,three'
          parseCSV(input)
        }).toThrow()
      })

      it('throws an error for closing parenthesis without opening', () => {
        expect(() => {
          const input = 'one),two,three'
          parseCSV(input)
        }).toThrow()
        expect(() => {
          const input = 'on)e,two),three'
          parseCSV(input)
        }).toThrow()
      })

      it('throws an error for unmatched parentheses', () => {
        expect(() => {
          const input = 'one,)two(,three'
          parseCSV(input)
        }).toThrow()
      })
    })

    describe('when parsing an empty string', () => {
      it('returns an empty array', () => {
        const result = parseCSV('')
        expect(result.length).toBe(0)
      })
    })

    describe('when parsing null values', () => {
      it('handles a leading null value', () => {
        const list: (string | null)[] = [null, 'two', 'three']
        const input = join(list)
        const result = parseCSV(input)
        expect(result).toStrictEqual(list)
      })

      it('handles a trailing null value', () => {
        const list: (string | null)[] = ['one', 'two', null]
        const input = join(list)
        const result = parseCSV(input)
        expect(result).toStrictEqual(list)
      })

      it('handles a null value in the middle', () => {
        const list: (string | null)[] = ['one', null, 'three']
        const input = join(list)
        const result = parseCSV(input)
        expect(result).toStrictEqual(list)
      })

      it('handles multiple consecutive null values', () => {
        const list: (string | null)[] = ['one', null, null, 'four']
        const input = join(list)
        const result = parseCSV(input)
        expect(result).toStrictEqual(list)
      })

      it('handles only null values', () => {
        const list: (string | null)[] = [null, null, null]
        const input = join(list)
        const result = parseCSV(input)
        expect(result).toStrictEqual(list)
      })
    })

    describe('when parsing parenthesized groups', () => {
      it('handles empty parenthesized groups', () => {
        const input = '()'
        const result = parseCSV(input)
        expect(result).toStrictEqual([null])
      })

      it('handles a simple parenthesized group', () => {
        const input = '(1,test,-20)'
        const result = parseCSV(input)
        expect(result).toStrictEqual(['1', 'test', '-20'])
      })

      it('handles two parenthesized groups in sequence', () => {
        const input = '(1,test,-20),(1,test,-20)'
        const result = parseCSV(input)
        expect(result).toStrictEqual(['(1,test,-20)', '(1,test,-20)'])
      })

      it('handles a nested parenthesized group within parentheses', () => {
        const input = '((1,test,-20),(1,test,-20))'
        const result = parseCSV(input)
        expect(result).toStrictEqual(['(1,test,-20)', '(1,test,-20)'])
      })

      it('handles a mix of a simple parenthesized group and a nested one', () => {
        const input = '(1,test,-20),((1,test,-20),(1,test,-20))'
        const result = parseCSV(input)
        expect(result).toStrictEqual(['(1,test,-20)', '((1,test,-20),(1,test,-20))'])
      })
    })
  })
})
