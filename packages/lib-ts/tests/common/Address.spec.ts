import { Address } from '../../common/Address'
import { Bytes } from '../../common/Bytes'
import { NULL_ADDRESS, randomAddress, randomHex } from '../helpers'

describe('Address', () => {
  describe('fromString', () => {
    describe('when the string is valid', () => {
      it('converts a valid string to an Address', () => {
        const validAddress = randomAddress()
        const address = Address.fromString(validAddress)

        expect(address.length).toBe(20)
        expect(address.toHex()).toBe(validAddress)
      })
    })

    describe('when the string length is invalid', () => {
      it('throws an error for short strings', () => {
        expect(() => {
          const shortAddress = randomHex(10)
          Address.fromString(shortAddress)
        }).toThrow('Invalid string for H160')
      })

      it('throws an error for long strings', () => {
        expect(() => {
          const longAddress = randomHex(50)
          Address.fromString(longAddress)
        }).toThrow('Invalid string for H160')
      })
    })
  })

  describe('fromBytes', () => {
    describe('when the Bytes object has a valid length', () => {
      it('converts a valid Bytes object to an Address', () => {
        const validBytes = Bytes.fromHexString(randomAddress())
        const address = Address.fromBytes(validBytes)

        expect(address.length).toBe(20)
        expect(address.toHex()).toBe(validBytes.toHex())
      })
    })

    describe('when the Bytes object has an invalid length', () => {
      it('throws an error for short Bytes objects', () => {
        expect(() => {
          const shortBytes = Bytes.fromHexString(randomHex(10))
          Address.fromBytes(shortBytes)
        }).toThrow('Bytes of length 5 can not be converted to 20 byte addresses')
      })

      it('throws an error for long Bytes objects', () => {
        expect(() => {
          const longBytes = Bytes.fromHexString(randomHex(50))
          Address.fromBytes(longBytes)
        }).toThrow('Bytes of length 25 can not be converted to 20 byte addresses')
      })
    })
  })

  describe('zero', () => {
    it('returns the zero address with length 20', () => {
      const zeroAddress = Address.zero()

      expect(zeroAddress.length).toBe(20)
      expect(zeroAddress.toHex()).toBe(NULL_ADDRESS)
    })

    it('returns a zero address where all bytes are equal to 0', () => {
      const zeroAddress = Address.zero()

      for (let i = 0; i < zeroAddress.length; i++) {
        expect(zeroAddress[i]).toBe(0)
      }
    })
  })
})
