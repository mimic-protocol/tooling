import { Address, ByteArray, Bytes } from '../types'
import { Option } from '../types/Option'

import { bytesToString } from './strings'

/**
 * Unsafe class to deserialize bytes into Rust-like types
 * Should be used with caution! This will only throw if there are insufficient bytes for the type
 */
export class BorshDeserializer {
  private _bytes: Uint8Array
  private _offset: u32 = 0

  constructor(bytes: Uint8Array) {
    this._bytes = bytes
  }

  static fromHex(hex: string): BorshDeserializer {
    return new BorshDeserializer(Bytes.fromHexString(hex))
  }

  static fromBytes(bytes: Uint8Array): BorshDeserializer {
    return new BorshDeserializer(bytes)
  }

  tryBool(): bool {
    if (this._offset >= this.getBytesLength()) throw new Error('Insufficient bytes for bool')
    const value = this._bytes.at(this._offset)
    this._offset += 1
    return value === 1
  }

  tryU8(): u8 {
    if (this._offset >= this.getBytesLength()) throw new Error('Insufficient bytes for u8')
    const value = this._bytes.at(this._offset)
    this._offset += 1
    return value
  }

  tryU16(): u16 {
    if (this._offset + 1 >= this.getBytesLength()) throw new Error('Insufficient bytes for u16')
    const subarray = changetype<ByteArray>(this._bytes.subarray(this._offset, this._offset + 2))
    this._offset += 2
    return subarray.toU16()
  }

  tryU32(): u32 {
    if (this._offset + 3 >= this.getBytesLength()) throw new Error('Insufficient bytes for u32')
    const subarray = changetype<ByteArray>(this._bytes.subarray(this._offset, this._offset + 4))
    this._offset += 4
    return subarray.toU32()
  }

  tryU64(): u64 {
    if (this._offset + 7 >= this.getBytesLength()) throw new Error('Insufficient bytes for u64')
    const subarray = changetype<ByteArray>(this._bytes.subarray(this._offset, this._offset + 8))
    this._offset += 8
    return subarray.toU64()
  }

  tryPubkey(): Address {
    if (this._offset + 31 >= this.getBytesLength()) throw new Error('Insufficient bytes for pubkey')
    const pubkey = Address.fromBytes(Bytes.fromUint8Array(this._bytes.subarray(this._offset, this._offset + 32)))
    this._offset += 32
    return pubkey
  }

  tryString(): string {
    const length = this.tryU32()
    if (this._offset + length - 1 >= this.getBytesLength())
      throw new Error(`Insufficient bytes for string of size ${length}`)
    const str = bytesToString(this._bytes.subarray(this._offset, this._offset + length), true)
    this._offset += length
    return str
  }

  tryOptionBool(): Option<bool> {
    const tag = this.tryU32()
    if (tag === 0) return Option.none<bool>()
    return Option.some<bool>(this.tryBool())
  }

  tryOptionU8(): Option<u8> {
    const tag = this.tryU32()
    if (tag === 0) return Option.none<u8>()
    return Option.some<u8>(this.tryU8())
  }

  tryOptionU16(): Option<u16> {
    const tag = this.tryU32()
    if (tag === 0) return Option.none<u16>()
    return Option.some<u16>(this.tryU16())
  }

  tryOptionU32(): Option<u32> {
    const tag = this.tryU32()
    if (tag === 0) return Option.none<u32>()
    return Option.some<u32>(this.tryU32())
  }

  tryOptionU64(): Option<u64> {
    const tag = this.tryU32()
    if (tag === 0) return Option.none<u64>()
    return Option.some<u64>(this.tryU64())
  }

  tryOptionPubkey(): Option<Address> {
    const tag = this.tryU32()
    if (tag === 0) return Option.none<Address>(Address.fromBytes(new Bytes(32)))
    return Option.some<Address>(this.tryPubkey())
  }

  private getBytesLength(): u32 {
    return this._bytes.length as u32
  }

  getOffset(): u32 {
    return this._offset
  }

  setOffset(offset: u32): void {
    if (offset > this.getBytesLength()) throw new Error('Offset overruns buffer length')
    this._offset = offset
  }

  isEmpty(): bool {
    return this._offset >= this.getBytesLength()
  }

  getLength(): u32 {
    return this._bytes.length
  }
}
