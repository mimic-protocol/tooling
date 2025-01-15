// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling).
// (Commit hash: 7faa3098b2e6c61f09fc81b8b2d333e66b0080d1)
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { ByteArray } from './ByteArray'

/** A dynamically-sized byte array. */
export class Bytes extends ByteArray {
  static fromByteArray(byteArray: ByteArray): Bytes {
    return changetype<Bytes>(byteArray)
  }

  static fromUint8Array(uint8Array: Uint8Array): Bytes {
    return changetype<Bytes>(uint8Array)
  }

  /**
   * Convert the string `hex` which must consist of an even number of
   * hexadecimal digits to a `ByteArray`. The string `hex` can optionally
   * start with '0x'
   */
  static fromHexString(str: string): Bytes {
    return changetype<Bytes>(ByteArray.fromHexString(str))
  }

  static fromUTF8(str: string): Bytes {
    return Bytes.fromByteArray(ByteArray.fromUTF8(str))
  }

  static fromI32(i: i32): Bytes {
    return changetype<Bytes>(ByteArray.fromI32(i))
  }

  static empty(): Bytes {
    return changetype<Bytes>(ByteArray.empty())
  }

  concat(other: ByteArray): Bytes {
    assert(other instanceof Bytes, 'Argument must be of type Bytes')
    return changetype<Bytes>(super.concat(other))
  }

  concatI32(other: i32): Bytes {
    return changetype<Bytes>(super.concat(ByteArray.fromI32(other)))
  }
}
