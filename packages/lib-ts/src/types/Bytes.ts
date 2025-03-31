// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { ByteArray } from './ByteArray'

/**
 * A dynamically-sized byte array with utility methods
 * for conversions between different formats.
 */
export class Bytes extends ByteArray {
  /**
   * Creates a Bytes instance from a ByteArray.
   */
  static fromByteArray(byteArray: ByteArray): Bytes {
    return changetype<Bytes>(byteArray)
  }

  /**
   * Creates a Bytes instance from a Uint8Array.
   */
  static fromUint8Array(uint8Array: Uint8Array): Bytes {
    return changetype<Bytes>(uint8Array)
  }

  /**
   * Converts a hexadecimal string to a Bytes instance.
   * The input must contain an even number of characters.
   * It may optionally start with '0x'.
   */
  static fromHexString(hex: string): Bytes {
    return changetype<Bytes>(ByteArray.fromHexString(hex))
  }

  /**
   * Converts a UTF-8 string to a Bytes instance.
   */
  static fromUTF8(str: string): Bytes {
    return Bytes.fromByteArray(ByteArray.fromUTF8(str))
  }

  /**
   * Returns an empty Bytes instance initialized to zero.
   */
  static empty(): Bytes {
    return changetype<Bytes>(ByteArray.empty())
  }

  /**
   * Creates a Bytes instance from a signed 8-bit integer (i8).
   * The resulting byte array is in little-endian order.
   */
  static fromI8(x: i8): Bytes {
    return changetype<Bytes>(ByteArray.fromI8(x))
  }

  /**
   * Creates a Bytes instance from an unsigned 8-bit integer (u8).
   * The resulting byte array is in little-endian order.
   */
  static fromU8(x: u8): Bytes {
    return changetype<Bytes>(ByteArray.fromU8(x))
  }

  /**
   * Creates a Bytes instance from a signed 16-bit integer (i16).
   * The resulting byte array is in little-endian order.
   */
  static fromI16(x: i16): Bytes {
    return changetype<Bytes>(ByteArray.fromI16(x))
  }

  /**
   * Creates a Bytes instance from an unsigned 16-bit integer (u16).
   * The resulting byte array is in little-endian order.
   */
  static fromU16(x: u16): Bytes {
    return changetype<Bytes>(ByteArray.fromU16(x))
  }

  /**
   * Creates a Bytes instance from a signed 32-bit integer (i32).
   * The resulting byte array is in little-endian order.
   */
  static fromI32(i: i32): Bytes {
    return changetype<Bytes>(ByteArray.fromI32(i))
  }

  /**
   * Creates a Bytes instance from an unsigned 32-bit integer (u32).
   * The resulting byte array is in little-endian order.
   */
  static fromU32(x: u32): Bytes {
    return changetype<Bytes>(ByteArray.fromU32(x))
  }

  /**
   * Creates a Bytes instance from a signed 64-bit integer (i64).
   * The resulting byte array is in little-endian order.
   */
  static fromI64(x: i64): Bytes {
    return changetype<Bytes>(ByteArray.fromI64(x))
  }

  /**
   * Creates a Bytes instance from an unsigned 64-bit integer (u64).
   * The resulting byte array is in little-endian order.
   */
  static fromU64(x: u64): Bytes {
    return changetype<Bytes>(ByteArray.fromU64(x))
  }

  /**
   * Creates a Bytes instance from a boolean value.
   * The resulting byte array is in little-endian order.
   */
  static fromBool(x: bool): Bytes {
    return changetype<Bytes>(ByteArray.fromBool(x))
  }

  /**
   * Concatenates this Bytes instance with another ByteArray.
   * The argument must be of type Bytes.
   */
  concat(other: ByteArray): Bytes {
    assert(other instanceof Bytes, 'Argument must be of type Bytes')
    return changetype<Bytes>(super.concat(other))
  }

  /**
   * Concatenates this Bytes instance with a signed 32-bit integer (i32).
   */
  concatI32(other: i32): Bytes {
    return changetype<Bytes>(super.concat(ByteArray.fromI32(other)))
  }
}
