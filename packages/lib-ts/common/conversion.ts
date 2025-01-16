// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { Bytes } from './Bytes'

export class typeConversion {
  static bytesToString(bytes: Uint8Array): string {
    return String.UTF8.decodeUnsafe(bytes.dataStart, bytes.length)
  }

  static bytesToHex(bytes: Uint8Array): string {
    let hex = '0x'
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0')
    }
    return hex
  }

  static bigIntToString(bigInt: Uint8Array): string {
    const byteArray = Bytes.fromUint8Array(bigInt)
    return byteArray.toString()
  }

  static bigIntToHex(bigInt: Uint8Array): string {
    return this.bytesToHex(bigInt)
  }

  static stringToH160(s: string): Bytes {
    const bytes = Bytes.fromHexString(s)
    if (bytes.length !== 20) throw new Error(`Invalid H160 string ${s} (expected length 20)`)
    return bytes
  }
}
