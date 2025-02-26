// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
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

  static fromBytes(b: Bytes): Address {
    if (b.length != 20) {
      throw new Error(`Bytes of length ${b.length} can not be converted to 20 byte addresses`)
    }
    return changetype<Address>(b)
  }

  static zero(): Address {
    const self = new ByteArray(20)

    return changetype<Address>(self)
  }

  clone(): Address {
    const copy = new ByteArray(this.length)
    copy.set(this)
    return changetype<Address>(copy)
  }
}
