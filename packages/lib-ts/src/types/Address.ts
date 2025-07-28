// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { isHex } from '../helpers'

import { ByteArray } from './ByteArray'
import { Bytes } from './Bytes'

/**
 * Represents an Ethereum or Solana address, a fixed-length 20 or 32-byte value.
 */
export class Address extends Bytes {
  /**
   * Returns an EVM zero address (20 bytes filled with zeroes).
   */
  static zero(): Address {
    const self = new ByteArray(20)
    return changetype<Address>(self)
  }

  /**
   * Converts a string representation of an address to an Address instance.
   * If hex, Ethereum address is returned. Otherwise, base58 (Solana) is assumed.
   */
  static fromString(str: string): Address {
    return isHex(str) ? this.fromHexString(str) : this.fromBase58String(str)
  }

  /**
   * Converts a hex string representation of an address to an Address instance.
   */
  static fromHexString(str: string): Address {
    const bytes = Bytes.fromHexString(str)
    return this.fromBytes(bytes)
  }

  /**
   * Converts a base58 string representation of an address to an Address instance.
   */
  static fromBase58String(str: string): Address {
    const bytes = Bytes.fromBase58String(str)
    return this.fromBytes(bytes)
  }

  /**
   * Converts a Bytes instance to an Address.
   * Throws an error if the input is not exactly 20 or 32 bytes long.
   */
  static fromBytes(bytes: Bytes): Address {
    if (bytes.length != 20 && bytes.length != 32)
      throw new Error(`Bytes of length ${bytes.length} can not be converted to 20/32 byte addresses`)
    return changetype<Address>(bytes)
  }

  /**
   * Returns the address in hexadecimal or base58, accordingly. This method is overridden to avoid
   * returning the UTF-8 encoded version of the address.
   */
  toString(): string {
    return this.isEVM() ? super.toHexString() : super.toBase58String()
  }

  clone(): Address {
    const copy = new ByteArray(this.length)
    copy.set(this)
    return changetype<Address>(copy)
  }

  isEVM(): bool {
    return this.length == 20
  }

  isSVM(): bool {
    return this.length == 32
  }
}
