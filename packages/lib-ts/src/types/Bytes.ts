// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { Serializable } from '../helpers'

import { ByteArray } from './ByteArray'

/**
 * A dynamically-sized byte array with utility methods
 * for conversions between different formats.
 */
export class Bytes extends ByteArray implements Serializable {
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
  static fromHexString(str: string): Bytes {
    return changetype<Bytes>(ByteArray.fromHexString(str))
  }

  /**
   * Converts a UTF-8 string to a Bytes instance.
   */
  static fromUTF8(str: string): Bytes {
    return Bytes.fromByteArray(ByteArray.fromUTF8(str))
  }

  /**
   * Creates a Bytes instance from a signed 32-bit integer (i32).
   * The resulting byte array is in little-endian order.
   */
  static fromI32(i: i32): Bytes {
    return changetype<Bytes>(ByteArray.fromI32(i))
  }

  /**
   * Returns an empty Bytes instance initialized to zero.
   */
  static empty(): Bytes {
    return changetype<Bytes>(ByteArray.empty())
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

  serialize(): string {
    return this.toHexString()
  }
}
