import { Address } from '../../common/Address'
import { Bytes } from '../../common/Bytes'
import { getHexString, getRandomAddress } from '../helpers'

describe('Address tests', () => {
  it('should convert a valid string to an Address', () => {
    const validAddressStr = getRandomAddress()
    const address = Address.fromString(validAddressStr)
    expect(address.length).toBe(20)
    expect(address.toHex()).toBe(validAddressStr)
  })

  it('should throw an error for invalid string length', () => {
    expect(() => {
      const shortAddress = getHexString(10)
      Address.fromString(shortAddress)
    }).toThrow('Invalid string for H160')

    expect(() => {
      const longAddress = getHexString(50)
      Address.fromString(longAddress)
    }).toThrow('Invalid string for H160')
  })

  it('should convert a valid Bytes object to an Address', () => {
    const validBytes = Bytes.fromHexString(getRandomAddress())
    const address = Address.fromBytes(validBytes)
    expect(address.length).toBe(20)
    expect(address.toHex()).toBe(validBytes.toHex())
  })

  it('should throw an error for Bytes with invalid length', () => {
    expect(() => {
      const shortBytes = Bytes.fromHexString(getHexString(10))
      Address.fromBytes(shortBytes)
    }).toThrow('Bytes of length 5 can not be converted to 20 byte addresses')

    expect(() => {
      const longBytes = Bytes.fromHexString(getHexString(50))
      Address.fromBytes(longBytes)
    }).toThrow('Bytes of length 25 can not be converted to 20 byte addresses')
  })

  it('should return the zero address', () => {
    const zeroAddress = Address.zero()
    expect(zeroAddress.length).toBe(20)
    expect(zeroAddress.toHex()).toBe('0x0000000000000000000000000000000000000000')
  })

  it('should return a zero address with all bytes equal to 0', () => {
    const zeroAddress = Address.zero()
    for (let i = 0; i < zeroAddress.length; i++) {
      expect(zeroAddress[i]).toBe(0)
    }
  })
})
