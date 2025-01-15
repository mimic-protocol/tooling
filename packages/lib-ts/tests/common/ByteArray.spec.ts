import { ByteArray } from '../../common/ByteArray'
import { getHexString, MAX_I32, MAX_I64, MAX_U32, MAX_U64 } from '../helpers'

describe('ByteArray tests', () => {
  it('creates ByteArray from i32', () => {
    const int32Value: i32 = MAX_I32
    const byteArray = ByteArray.fromI32(int32Value)
    expect(byteArray.length).toBe(4)
    expect(byteArray[0]).toBe((int32Value & 0xff) as u8)
    expect(byteArray[1]).toBe(((int32Value >> 8) & 0xff) as u8)
    expect(byteArray[2]).toBe(((int32Value >> 16) & 0xff) as u8)
    expect(byteArray[3]).toBe(((int32Value >> 24) & 0xff) as u8)
  })

  it('creates ByteArray from u32', () => {
    const uint32Value: u32 = MAX_U32
    const byteArray = ByteArray.fromU32(uint32Value)
    expect(byteArray.length).toBe(4)
    expect(byteArray[0]).toBe((uint32Value & 0xff) as u8)
    expect(byteArray[1]).toBe(((uint32Value >> 8) & 0xff) as u8)
    expect(byteArray[2]).toBe(((uint32Value >> 16) & 0xff) as u8)
    expect(byteArray[3]).toBe(((uint32Value >> 24) & 0xff) as u8)
  })

  it('creates ByteArray from i64', () => {
    const int64Value: i64 = MAX_I64
    const byteArray = ByteArray.fromI64(int64Value)
    expect(byteArray.length).toBe(8)
    for (let i = 0; i < 8; i++) {
      expect(byteArray[i]).toBe(((int64Value >> (i * 8)) & 0xff) as u8)
    }
  })

  it('creates ByteArray from u64', () => {
    const uint64Value: u64 = MAX_U64
    const byteArray = ByteArray.fromU64(uint64Value)
    expect(byteArray.length).toBe(8)
    for (let i = 0; i < 8; i++) {
      expect(byteArray[i]).toBe(((uint64Value >> (i * 8)) & 0xff) as u8)
    }
  })

  it('creates empty ByteArray', () => {
    const emptyByteArray = ByteArray.empty()
    expect(emptyByteArray.length).toBe(4)
    expect(emptyByteArray[0]).toBe(0)
    expect(emptyByteArray[1]).toBe(0)
    expect(emptyByteArray[2]).toBe(0)
    expect(emptyByteArray[3]).toBe(0)
  })

  it('creates ByteArray from hex string', () => {
    const hexString = getHexString(8)
    const byteArray = ByteArray.fromHexString(hexString)
    expect(byteArray.length).toBe(4)
    expect(byteArray.toHex()).toBe(hexString.toLowerCase())
  })

  it('throws an error for odd-length hex string', () => {
    expect(() => {
      const invalidHexString = '0x123'
      ByteArray.fromHexString(invalidHexString)
    }).toThrow('has odd length')
  })
})
