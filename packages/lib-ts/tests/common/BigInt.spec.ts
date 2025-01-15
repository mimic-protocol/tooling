import { BigInt } from '../../common/BigInt'
import { ByteArray } from '../../common/ByteArray'
import { Bytes } from '../../common/Bytes'
import { MAX_I32, MAX_I64, MAX_U32, MAX_U64 } from '../helpers'

describe('BigInt tests', () => {
  it('creates BigInt from i32', () => {
    const int32Value: i32 = MAX_I32
    const bigInt = BigInt.fromI32(int32Value)
    expect(bigInt.length).toBe(4)
    expect(bigInt[0]).toBe((int32Value & 0xff) as u8)
    expect(bigInt[1]).toBe(((int32Value >> 8) & 0xff) as u8)
    expect(bigInt[2]).toBe(((int32Value >> 16) & 0xff) as u8)
    expect(bigInt[3]).toBe(((int32Value >> 24) & 0xff) as u8)
  })

  it('creates BigInt from u32', () => {
    const uint32Value: u32 = MAX_U32
    const bigInt = BigInt.fromU32(uint32Value)
    expect(bigInt.length).toBeGreaterThanOrEqual(4)
  })

  it('creates BigInt from i64', () => {
    const int64Value: i64 = MAX_I64
    const bigInt = BigInt.fromI64(int64Value)
    expect(bigInt.length).toBe(8)
    for (let i = 0; i < 8; i++) {
      expect(bigInt[i]).toBe(((int64Value >> (i * 8)) & 0xff) as u8)
    }
  })

  it('creates BigInt from u64', () => {
    const uint64Value: u64 = MAX_U64
    const bigInt = BigInt.fromU64(uint64Value)
    expect(bigInt.length).toBeGreaterThanOrEqual(8)
  })

  it('returns zero BigInt', () => {
    const zeroBigInt = BigInt.zero()
    expect(zeroBigInt.length).toBe(4)
    expect(zeroBigInt[0]).toBe(0)
    expect(zeroBigInt[1]).toBe(0)
    expect(zeroBigInt[2]).toBe(0)
    expect(zeroBigInt[3]).toBe(0)
  })

  it('creates BigInt from signed bytes', () => {
    const bytes = Bytes.fromHexString('0x12345678')
    const bigInt = BigInt.fromSignedBytes(bytes)
    expect(bigInt.length).toBe(4)
  })

  it('creates BigInt from byte array', () => {
    const byteArray = ByteArray.fromHexString('0x12345678')
    const bigInt = BigInt.fromByteArray(byteArray)
    expect(bigInt.length).toBe(4)
  })

  it('creates BigInt from unsigned bytes', () => {
    const bytes = Bytes.fromHexString('0x12345678')
    const bigInt = BigInt.fromUnsignedBytes(bytes)
    expect(bigInt.length).toBeGreaterThanOrEqual(4)
  })
})
