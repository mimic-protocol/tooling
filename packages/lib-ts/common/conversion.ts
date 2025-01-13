// This file is based on code from "The Graph Node" (https://github.com/graphprotocol/graph-node).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { Bytes } from './Bytes'

export declare namespace typeConversion {
  function bytesToString(bytes: Uint8Array): string
  function bytesToHex(bytes: Uint8Array): string
  function bigIntToString(bigInt: Uint8Array): string
  function bigIntToHex(bigInt: Uint8Array): string
  function stringToH160(s: string): Bytes
}
