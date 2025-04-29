// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { bytesToHexString, bytesToString } from '../helpers'
import { Serializable } from '../helpers'

import { BigInt } from './BigInt'
import { Bytes } from './Bytes'

/**
 * Represents a byte array (Uint8Array) with utility methods
 * for conversions between different numeric and string formats.
 */
export class ByteArray extends Uint8Array implements Serializable {
  /**
   * Creates an empty ByteArray.
   * The resulting byte array is in little-endian order.
   */
  static empty(): ByteArray {
    return new ByteArray(0)
  }

  /**
   * Creates a ByteArray from a signed 8-bit integer (i8).
   * The resulting byte array is in little-endian order.
   */
  static fromI8(x: i8): ByteArray {
    return ByteArray.fromInteger(x, 1)
  }

  /**
   * Creates a ByteArray from an unsigned 8-bit integer (u8).
   * The resulting byte array is in little-endian order.
   */
  static fromU8(x: u8): ByteArray {
    return ByteArray.fromInteger(x, 1)
  }

  /**
   * Creates a ByteArray from a signed 16-bit integer (i16).
   * The resulting byte array is in little-endian order.
   */
  static fromI16(x: i16): ByteArray {
    return ByteArray.fromInteger(x, 2)
  }

  /**
   * Creates a ByteArray from an unsigned 16-bit integer (u16).
   * The resulting byte array is in little-endian order.
   */
  static fromU16(x: u16): ByteArray {
    return ByteArray.fromInteger(x, 2)
  }

  /**
   * Creates a ByteArray from a signed 32-bit integer (i32).
   * The resulting byte array is in little-endian order.
   */
  static fromI32(x: i32): ByteArray {
    return ByteArray.fromInteger(x, 4)
  }

  /**
   * Creates a ByteArray from an unsigned 32-bit integer (u32).
   * The resulting byte array is in little-endian order.
   */
  static fromU32(x: u32): ByteArray {
    return ByteArray.fromInteger(x, 4)
  }

  /**
   * Creates a ByteArray from a signed 64-bit integer (i64).
   * The resulting byte array is in little-endian order.
   */
  static fromI64(x: i64): ByteArray {
    return ByteArray.fromInteger(x, 8)
  }

  /**
   * Creates a ByteArray from an unsigned 64-bit integer (u64).
   * The resulting byte array is in little-endian order.
   */
  static fromU64(x: u64): ByteArray {
    return ByteArray.fromInteger(x, 8)
  }

  /**
   * Creates a ByteArray from a boolean value.
   * The resulting byte array is in little-endian order.
   */
  static fromBool(x: bool): ByteArray {
    return ByteArray.fromInteger((x ? 1 : 0) as u8, 1)
  }

  /**
   * Converts a hexadecimal string to a ByteArray.
   * The input must contain an even number of characters.
   * It may optionally start with '0x'.
   */
  static fromHexString(hex: string): ByteArray {
    assert(hex.length % 2 == 0, 'input ' + hex + ' has odd length')
    if (hex.length >= 2 && hex.charAt(0) == '0' && hex.charAt(1) == 'x') hex = hex.substring(2)
    const output = new Bytes(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) output[i / 2] = I8.parseInt(hex.substring(i, i + 2), 16)
    return output
  }

  /**
   * Converts a UTF-8 string to a ByteArray.
   */
  static fromUTF8(str: string): ByteArray {
    const utf8 = String.UTF8.encode(str)
    return changetype<ByteArray>(ByteArray.wrap(utf8))
  }

  /**
   * Converts a BigInt to a ByteArray.
   */
  static fromBigInt(bigInt: BigInt): ByteArray {
    return changetype<ByteArray>(bigInt)
  }

  /**
   * Creates a ByteArray from an unsigned arbitrary-length integer.
   * The resulting byte array is in little-endian order.
   */
  private static fromInteger<T extends number>(value: T, length: u8): ByteArray {
    const self = new ByteArray(length)
    for (let i: u8 = 0; i < length; i++) self[i] = (value >> (i * 8)) as u8
    return self
  }

  /**
   * Concatenates this ByteArray with another ByteArray.
   */
  concat(other: ByteArray): ByteArray {
    const newArray = new ByteArray(this.length + other.length)
    newArray.set(this, 0)
    newArray.set(other, this.length)
    return newArray
  }

  /**
   * Concatenates this ByteArray with a signed 32-bit integer.
   */
  concatI32(other: i32): ByteArray {
    return this.concat(ByteArray.fromI32(other))
  }

  /**
   * Compares this ByteArray to another for equality.
   */
  @operator('==')
  equals(other: ByteArray): boolean {
    if (this.length != other.length) return false
    for (let i = 0; i < this.length; i++) if (this[i] != other[i]) return false
    return true
  }

  /**
   * Compares this ByteArray to another for inequality.
   */
  @operator('!=')
  notEqual(other: ByteArray): boolean {
    return !(this == other)
  }

  /**
   * Interprets the byte array as a little-endian U32.
   * Throws in case of overflow.
   */
  toU32(): u32 {
    for (let i = 4; i < this.length; i++) {
      if (this[i] != 0) {
        assert(false, 'overflow converting ' + this.toHexString() + ' to u32')
      }
    }
    const paddedBytes = new Bytes(4)
    paddedBytes[0] = 0
    paddedBytes[1] = 0
    paddedBytes[2] = 0
    paddedBytes[3] = 0
    const minLen = paddedBytes.length < this.length ? paddedBytes.length : this.length
    for (let i = 0; i < minLen; i++) {
      paddedBytes[i] = this[i]
    }
    let x: u32 = 0
    x = (x | paddedBytes[3]) << 8
    x = (x | paddedBytes[2]) << 8
    x = (x | paddedBytes[1]) << 8
    x = x | paddedBytes[0]
    return x
  }

  /**
   * Interprets the byte array as a little-endian I32.
   * Throws in case of overflow.
   */
  toI32(): i32 {
    const isNeg = this.length > 0 && this[this.length - 1] >> 7 == 1
    const padding = isNeg ? 255 : 0
    for (let i = 4; i < this.length; i++) {
      if (this[i] != padding) {
        assert(false, 'overflow converting ' + this.toHexString() + ' to i32')
      }
    }

    const paddedBytes = new Bytes(4)
    paddedBytes[0] = padding
    paddedBytes[1] = padding
    paddedBytes[2] = padding
    paddedBytes[3] = padding
    const minLen = paddedBytes.length < this.length ? paddedBytes.length : this.length
    for (let i = 0; i < minLen; i++) paddedBytes[i] = this[i]

    let x: i32 = 0
    x = (x | paddedBytes[3]) << 8
    x = (x | paddedBytes[2]) << 8
    x = (x | paddedBytes[1]) << 8
    x = x | paddedBytes[0]
    return x
  }

  /**
   * Interprets the byte array as a little-endian I64.
   * Throws in case of overflow.
   */
  toI64(): i64 {
    const isNeg = this.length > 0 && this[this.length - 1] >> 7 == 1
    const padding = isNeg ? 255 : 0
    for (let i = 8; i < this.length; i++) {
      if (this[i] != padding) {
        assert(false, 'overflow converting ' + this.toHexString() + ' to i64')
      }
    }

    const paddedBytes = new Bytes(8)
    paddedBytes[0] = padding
    paddedBytes[1] = padding
    paddedBytes[2] = padding
    paddedBytes[3] = padding
    paddedBytes[4] = padding
    paddedBytes[5] = padding
    paddedBytes[6] = padding
    paddedBytes[7] = padding
    const minLen = paddedBytes.length < this.length ? paddedBytes.length : this.length
    for (let i = 0; i < minLen; i++) paddedBytes[i] = this[i]

    let x: i64 = 0
    x = (x | paddedBytes[7]) << 8
    x = (x | paddedBytes[6]) << 8
    x = (x | paddedBytes[5]) << 8
    x = (x | paddedBytes[4]) << 8
    x = (x | paddedBytes[3]) << 8
    x = (x | paddedBytes[2]) << 8
    x = (x | paddedBytes[1]) << 8
    x = x | paddedBytes[0]
    return x
  }

  /**
   * Interprets the byte array as a little-endian U64.
   * Throws in case of overflow.
   */
  toU64(): u64 {
    for (let i = 8; i < this.length; i++) {
      if (this[i] != 0) {
        assert(false, 'overflow converting ' + this.toHexString() + ' to u64')
      }
    }

    const paddedBytes = new Bytes(8)
    paddedBytes[0] = 0
    paddedBytes[1] = 0
    paddedBytes[2] = 0
    paddedBytes[3] = 0
    paddedBytes[4] = 0
    paddedBytes[5] = 0
    paddedBytes[6] = 0
    paddedBytes[7] = 0
    const minLen = paddedBytes.length < this.length ? paddedBytes.length : this.length
    for (let i = 0; i < minLen; i++) paddedBytes[i] = this[i]

    let x: u64 = 0
    x = (x | paddedBytes[7]) << 8
    x = (x | paddedBytes[6]) << 8
    x = (x | paddedBytes[5]) << 8
    x = (x | paddedBytes[4]) << 8
    x = (x | paddedBytes[3]) << 8
    x = (x | paddedBytes[2]) << 8
    x = (x | paddedBytes[1]) << 8
    x = x | paddedBytes[0]
    return x
  }

  /**
   * Converts this ByteArray to a hexadecimal string.
   */
  toHexString(): string {
    return bytesToHexString(this)
  }

  /**
   * Converts this ByteArray to a string representation.
   */
  toString(): string {
    return bytesToString(this)
  }

  serialize(): string {
    return this.toHexString()
  }
}
