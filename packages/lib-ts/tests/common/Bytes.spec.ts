import { ByteArray, Bytes } from '../../common'
import { randomHex } from '../helpers'

describe('Bytes', () => {
  describe('fromByteArray', () => {
    describe('when creating Bytes from a ByteArray', () => {
      it('creates Bytes with the same length and content as the ByteArray', (): void => {
        const byteArray = ByteArray.fromHexString(randomHex(6))
        const bytes = Bytes.fromByteArray(byteArray)
        expect(bytes.length).toBe(byteArray.length)
        expect(bytes.toHex()).toBe(byteArray.toHex())
      })
    })
  })

  describe('fromUint8Array', () => {
    describe('when creating Bytes from a Uint8Array', () => {
      it('creates Bytes with the same length and values as the Uint8Array', (): void => {
        const uint8Array = new Uint8Array(5).fill(255)
        const bytes = Bytes.fromUint8Array(uint8Array)
        expect(bytes.length).toBe(5)
        for (let i = 0; i < bytes.length; i++) {
          expect(bytes[i]).toBe(255)
        }
      })
    })
  })

  describe('fromHexString', () => {
    describe('when creating Bytes from a valid hex string', () => {
      it('creates Bytes with the correct values', (): void => {
        const hexString = randomHex(8)
        const bytes = Bytes.fromHexString(hexString)
        expect(bytes.length).toBe(4)
        expect(bytes.toHex()).toBe(hexString.toLowerCase())
      })
    })
  })

  describe('fromUTF8', () => {
    describe('when creating Bytes from a UTF-8 string', () => {
      it('creates Bytes with the encoded values of the string', (): void => {
        const utf8String = 'hello'
        const bytes = Bytes.fromUTF8(utf8String)
        expect(bytes.length).toBe(utf8String.length)
        for (let i = 0; i < bytes.length; i++) {
          expect(bytes[i]).toBe(utf8String.charCodeAt(i) as u8)
        }
      })
    })
  })

  describe('empty', () => {
    describe('when creating empty Bytes', () => {
      it('creates Bytes initialized to 0', (): void => {
        const emptyBytes = Bytes.empty()
        expect(emptyBytes.toI32()).toBe(0)
      })
    })
  })

  describe('concat', () => {
    describe('when concatenating two Bytes', () => {
      it('returns a Bytes instance with the combined length', (): void => {
        const bytes1 = Bytes.fromHexString(randomHex(10))
        const bytes2 = Bytes.fromHexString(randomHex(10))
        const concatenatedBytes = bytes1.concat(bytes2)
        expect(concatenatedBytes.length).toBe(bytes1.length + bytes2.length)
      })
    })
  })

  describe('concatI32', () => {
    describe('when concatenating Bytes with an i32 value', () => {
      it('returns a Bytes instance with the correct combined length', (): void => {
        const bytes = Bytes.fromHexString(randomHex(8))
        const int32Value = 99999
        const concatenatedBytes = bytes.concatI32(int32Value)
        expect(concatenatedBytes.length).toBe(bytes.length + 4)
      })
    })
  })
})
