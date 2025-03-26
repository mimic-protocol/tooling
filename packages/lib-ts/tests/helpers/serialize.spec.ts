import { join, NULL_ADDRESS, serialize } from '../../src/helpers'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes } from '../../src/types'
import { randomToken } from '../helpers'

describe('serialize', () => {
  describe('serialize', () => {
    describe('when passing an Address', () => {
      it('converts it to string correctly', () => {
        const address = Address.fromString(NULL_ADDRESS)
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

        const symbol = token.symbol
        const address = token.address.toHexString()
        const chainId = token.chainId
        const decimals = token.decimals
        expect(serialized).toBe(`${symbol},${address},${chainId},${decimals}`)
      })
    })

    describe('when passing a TokenAmount', () => {
      it('converts it to string correctly', () => {
        const token = randomToken()
        const amount = BigInt.fromI32(5)
        const tokenAmount = new TokenAmount(token, amount)
        const serialized = serialize(tokenAmount)

        const serializedToken = serialize(token)
        expect(serialized).toBe(`${amount.serialize()},${serializedToken}`)
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
})
