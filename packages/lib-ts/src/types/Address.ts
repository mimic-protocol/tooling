// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { EVM_NATIVE_ADDRESS, isHex, USD_ADDRESS } from '../helpers'

import { ByteArray } from './ByteArray'
import { Bytes } from './Bytes'
import { Option } from './Option'

/**
 * Represents an EVM or SVM address, a fixed-length 20 or 32-byte value.
 */
export class Address extends Bytes {
  /**
   * Returns a zero address (default 20 bytes filled with zeroes).
   */
  static zero(length: i32 = 20): Address {
    const self = new ByteArray(length)
    return changetype<Address>(self)
  }

  /**
   * Returns a None variant for the Option type, representing no address
   * @param length 32 by default (SVM)
   * @returns Option.none with empty bytes
   */
  static none(length: u32 = 32): Option<Address> {
    return Option.none<Address>(Address.fromBytes(new Bytes(length)))
  }

  /**
   * Returns the USD denomination address.
   */
  static USD(): Address {
    return Address.fromString(USD_ADDRESS)
  }

  /**
   * Returns the native address.
   */
  static native(): Address {
    return Address.fromString(EVM_NATIVE_ADDRESS)
  }

  /**
   * Converts a string representation of an address to an Address instance.
   * If hex, EVM address is returned. Otherwise, base58 (SVM) is assumed.
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
      throw new Error(`Bytes of length ${bytes.length} can not be converted to 20 or 32 byte addresses`)
    return changetype<Address>(bytes)
  }

  /**
   * Returns a copy of this address.
   */
  clone(): Address {
    return changetype<Address>(this.slice(0))
  }

  /**
   * Tells whether this address is an Ethereum address.
   */
  isEVM(): bool {
    return this.length == 20
  }

  /**
   * Tells whether this address is a Solana address.
   */
  isSVM(): bool {
    return this.length == 32
  }

  /**
   * Tells whether this address is the USD denomination address.
   */
  isUsd(): boolean {
    return this.equals(Address.USD())
  }

  /**
   * Tells whether this address is the native address.
   */
  isNative(): boolean {
    return this.equals(Address.native())
  }

  /**
   * Returns the address in hexadecimal or base58, accordingly. This method is overridden to avoid
   * returning the UTF-8 encoded version of the address.
   */
  toString(): string {
    return this.isEVM() ? super.toHexString() : super.toBase58String()
  }

  /**
   * Returns the address as its underlying bytes
   */
  toBytes(): Bytes {
    return changetype<Bytes>(this.slice(0))
  }
}
