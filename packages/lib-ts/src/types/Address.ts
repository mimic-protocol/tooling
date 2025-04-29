// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { ByteArray } from './ByteArray'
import { Bytes } from './Bytes'

/**
 * Represents an Ethereum address, a fixed-length 20-byte value.
 */
export class Address extends Bytes {
  /**
   * Returns a zero address (20 bytes filled with zeroes).
   */
  static zero(): Address {
    const self = new ByteArray(20)
    return changetype<Address>(self)
  }

  /**
   * Converts a string representation of an address to an Address instance.
   */
  static fromString(str: string): Address {
    const bytes = Bytes.fromHexString(str)
    return this.fromBytes(bytes)
  }

  /**
   * Converts a Bytes instance to an Address.
   * Throws an error if the input is not exactly 20 bytes long.
   */
  static fromBytes(bytes: Bytes): Address {
    if (bytes.length != 20) throw new Error(`Bytes of length ${bytes.length} can not be converted to 20 byte addresses`)
    return changetype<Address>(bytes)
  }

  clone(): Address {
    const copy = new ByteArray(this.length)
    copy.set(this)
    return changetype<Address>(copy)
  }
}
