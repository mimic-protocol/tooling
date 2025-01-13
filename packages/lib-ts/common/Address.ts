// This file is based on code from "The Graph Node" (https://github.com/graphprotocol/graph-node).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { ByteArray } from './ByteArray'
import { Bytes } from './Bytes'
import { typeConversion } from './conversion'

export class Address extends Bytes {
  static fromString(s: string): Address {
    return changetype<Address>(typeConversion.stringToH160(s))
  }

  /** Convert `Bytes` that must be exactly 20 bytes long to an address.
   * Passing in a value with fewer or more bytes will result in an error */
  static fromBytes(b: Bytes): Address {
    if (b.length != 20) {
      throw new Error(`Bytes of length ${b.length} can not be converted to 20 byte addresses`)
    }
    return changetype<Address>(b)
  }

  static zero(): Address {
    const self = new ByteArray(20)

    for (let i = 0; i < 20; i++) {
      self[i] = 0
    }

    return changetype<Address>(self)
  }
}
