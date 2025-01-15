import { ByteArray } from '../../common/ByteArray'
import { Bytes } from '../../common/Bytes'
import { getHexString } from '../helpers'

describe('Bytes tests', () => {
  it('creates Bytes from ByteArray', () => {
    const byteArray = ByteArray.fromHexString(getHexString(6))
    const bytes = Bytes.fromByteArray(byteArray)
    expect(bytes.length).toBe(byteArray.length)
    expect(bytes.toHex()).toBe(byteArray.toHex())
  })

  it('creates Bytes from Uint8Array', () => {
    const uint8Array = new Uint8Array(5).fill(255)
    const bytes = Bytes.fromUint8Array(uint8Array)
    expect(bytes.length).toBe(5)
    for (let i = 0; i < bytes.length; i++) {
      expect(bytes[i]).toBe(255)
    }
  })

  it('creates Bytes from hex string', () => {
    const hexString = getHexString(8)
    const bytes = Bytes.fromHexString(hexString)
    expect(bytes.length).toBe(4)
    expect(bytes.toHex()).toBe(hexString.toLowerCase())
  })

  it('creates Bytes from UTF-8 string', () => {
    const utf8String = 'hello'
    const bytes = Bytes.fromUTF8(utf8String)
    expect(bytes.length).toBe(utf8String.length)
  })

  it('creates Bytes from i32', () => {
    const int32Value = 123456
    const bytes = Bytes.fromI32(int32Value)
    expect(bytes.length).toBe(4)
  })

  it('creates empty Bytes', () => {
    const emptyBytes = Bytes.empty()
    expect(emptyBytes.toI32()).toBe(0)
  })

  it('concatenates two Bytes', () => {
    const bytes1 = Bytes.fromHexString(getHexString(10))
    const bytes2 = Bytes.fromHexString(getHexString(10))
    const concatenatedBytes = bytes1.concat(bytes2)
    expect(concatenatedBytes.length).toBe(bytes1.length + bytes2.length)
  })

  it('concatenates Bytes with i32', () => {
    const bytes = Bytes.fromHexString(getHexString(8))
    const int32Value = 99999
    const concatenatedBytes = bytes.concatI32(int32Value)
    expect(concatenatedBytes.length).toBe(bytes.length + 4)
  })
})
