// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { ByteArray } from './ByteArray'
import { Bytes } from './Bytes'
import { typeConversion } from './conversion'

/** An arbitrary size integer represented as an array of bytes. */
export class BigInt extends Uint8Array {
  static fromI32(x: i32): BigInt {
    const byteArray = ByteArray.fromI32(x)
    return BigInt.fromByteArray(byteArray)
  }

  static fromU32(x: u32): BigInt {
    const byteArray = ByteArray.fromU32(x)
    return BigInt.fromUnsignedBytes(byteArray)
  }

  static fromI64(x: i64): BigInt {
    const byteArray = ByteArray.fromI64(x)
    return BigInt.fromByteArray(byteArray)
  }

  static fromU64(x: u64): BigInt {
    const byteArray = ByteArray.fromU64(x)
    return BigInt.fromUnsignedBytes(byteArray)
  }

  static zero(): BigInt {
    return BigInt.fromI32(0)
  }

  static fromSignedBytes(bytes: Bytes): BigInt {
    return BigInt.fromByteArray(changetype<ByteArray>(bytes))
  }

  static fromByteArray(byteArray: ByteArray): BigInt {
    return changetype<BigInt>(byteArray)
  }

  static fromUnsignedBytes(bytes: ByteArray): BigInt {
    const signedBytes = new BigInt(bytes.length + 1)
    for (let i = 0; i < bytes.length; i++) {
      signedBytes[i] = bytes[i]
    }
    signedBytes[bytes.length] = 0
    return signedBytes
  }

  clone(): BigInt {
    const clone = new BigInt(this.length)
    for (let i = 0; i < this.length; i++) {
      clone[i] = this[i]
    }
    return clone
  }

  subarray(start: i32, end: i32): BigInt {
    const result = new BigInt(end - start)
    for (let i = start; i < end; i++) {
      result[i - start] = this[i]
    }
    return result
  }

  toHex(): string {
    return typeConversion.bigIntToHex(this)
  }

  toHexString(): string {
    return typeConversion.bigIntToHex(this)
  }

  toString(): string {
    return typeConversion.bigIntToString(this)
  }

  static fromString(str: string): BigInt {
    if (!str || str.length === 0) {
      return BigInt.zero()
    }

    let index = 0
    let isNegative = false

    // Optional sign
    let firstChar = str.charAt(index)
    if (firstChar === '-') {
      isNegative = true
      index++
    } else if (firstChar === '+') {
      index++
    }

    // Hex prefix
    let isHex = false
    if (
      str.length >= index + 2 &&
      str.charAt(index) === '0' &&
      (str.charAt(index + 1) === 'x' || str.charAt(index + 1) === 'X')
    ) {
      isHex = true
      index += 2
    }

    let result = BigInt.zero()
    let exponentStr = ''
    let exponentNegative = false
    let parsingExponent = false
    let fractionDigits = 0

    if (isHex) {
      while (index < str.length) {
        let c = str.charAt(index)
        let digit: i32

        if (c >= '0' && c <= '9') {
          digit = c.charCodeAt(0) - '0'.charCodeAt(0)
        } else if (c >= 'A' && c <= 'F') {
          digit = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10
        } else if (c >= 'a' && c <= 'f') {
          digit = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10
        } else {
          throw new Error(`Invalid character in hex string: '${c}'`)
        }

        result = result.times(BigInt.fromI32(16)).plus(BigInt.fromI32(digit))
        index++
      }
    } else {
      while (index < str.length) {
        let c = str.charAt(index)

        if (!parsingExponent) {
          if (c === '.') {
            index++
            while (index < str.length) {
              let fracChar = str.charAt(index)
              if (fracChar === 'e' || fracChar === 'E') {
                parsingExponent = true
                index++
                break
              } else if (fracChar >= '0' && fracChar <= '9') {
                let digit = fracChar.charCodeAt(0) - '0'.charCodeAt(0)
                result = result.times(BigInt.fromI32(10)).plus(BigInt.fromI32(digit))
                fractionDigits++
                index++
              } else {
                throw new Error(`Invalid character in decimal fraction: '${fracChar}'`)
              }
            }
            continue
          }
          if (c === 'e' || c === 'E') {
            parsingExponent = true
            index++
            continue
          }
          if (c < '0' || c > '9') {
            throw new Error(`Invalid character in decimal string: '${c}'`)
          }
          let digit = c.charCodeAt(0) - '0'.charCodeAt(0)
          result = result.times(BigInt.fromI32(10)).plus(BigInt.fromI32(digit))
        } else {
          if (exponentStr.length === 0 && (c === '+' || c === '-')) {
            if (c === '-') exponentNegative = true
            index++
            continue
          }
          if (c < '0' || c > '9') {
            throw new Error(`Invalid character in exponent string: '${c}'`)
          }
          exponentStr += c
        }

        index++
      }
    }

    if (!isHex) {
      if (exponentStr.length > 0) {
        let expValue = parseInt(exponentStr, 10)
        if (exponentNegative) expValue = -expValue
        expValue -= fractionDigits
        if (expValue > 0) {
          for (let i = 0; i < expValue; i++) {
            result = result.times(BigInt.fromI32(10))
          }
        } else if (expValue < 0) {
          let positiveExp = -expValue
          for (let i = 0; i < positiveExp; i++) {
            result = result.div(BigInt.fromI32(10))
          }
        }
      } else if (fractionDigits > 0) {
        // No exponent => truncate fraction
        for (let i = 0; i < fractionDigits; i++) {
          result = result.div(BigInt.fromI32(10))
        }
      }
    }

    if (isNegative && !result.isZero()) {
      result = result.neg()
    }

    return result
  }

  toI32(): i32 {
    const uint8Array = changetype<Uint8Array>(this)
    const byteArray = changetype<ByteArray>(uint8Array)
    return byteArray.toI32()
  }

  toU32(): u32 {
    const uint8Array = changetype<Uint8Array>(this)
    const byteArray = changetype<ByteArray>(uint8Array)
    return byteArray.toU32()
  }

  toI64(): i64 {
    const uint8Array = changetype<Uint8Array>(this)
    const byteArray = changetype<ByteArray>(uint8Array)
    return byteArray.toI64()
  }

  toU64(): u64 {
    const uint8Array = changetype<Uint8Array>(this)
    const byteArray = changetype<ByteArray>(uint8Array)
    return byteArray.toU64()
  }

  isZero(): boolean {
    return BigInt.compare(this, BigInt.zero()) == 0
  }

  isI32(): boolean {
    return BigInt.fromI32(i32.MIN_VALUE) <= this && this <= BigInt.fromI32(i32.MAX_VALUE)
  }

  abs(): BigInt {
    return this < BigInt.fromI32(0) ? this.neg() : this
  }

  sqrt(): BigInt {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const x = this
    let z = x.plus(BigInt.fromI32(1)).div(BigInt.fromI32(2))
    let y = x
    while (z < y) {
      y = z as this
      z = x.div(z).plus(z).div(BigInt.fromI32(2))
    }
    return y
  }

  @operator('+')
  plus(other: BigInt): BigInt {
    const aIsNeg = this.isNegative()
    const bIsNeg = other.isNegative()
    if (aIsNeg === bIsNeg) {
      const resultAbs = BigInt.addUnsigned(this.abs(), other.abs())
      return aIsNeg ? resultAbs.neg() : resultAbs
    }
    const cmp = BigInt.compare(this.abs(), other.abs())
    if (cmp === 0) {
      return BigInt.zero()
    } else if (cmp > 0) {
      const resultAbs = BigInt.subUnsigned(this.abs(), other.abs())
      return this.isNegative() ? resultAbs.neg() : resultAbs
    } else {
      const resultAbs = BigInt.subUnsigned(other.abs(), this.abs())
      return other.isNegative() ? resultAbs.neg() : resultAbs
    }
  }

  @operator('-')
  minus(other: BigInt): BigInt {
    return this.plus(other.neg())
  }

  @operator('*')
  times(other: BigInt): BigInt {
    const aIsNeg = this.isNegative()
    const bIsNeg = other.isNegative()
    const signIsNeg = (aIsNeg && !bIsNeg) || (!aIsNeg && bIsNeg)
    const absA = aIsNeg ? this.neg() : this
    const absB = bIsNeg ? other.neg() : other
    const resultAbs = BigInt.mulUnsigned(absA, absB)
    return signIsNeg ? resultAbs.neg() : resultAbs
  }

  @operator('/')
  div(other: BigInt): BigInt {
    assert(!other.isZero(), 'Trying to divide by zero')
    const aIsNeg = this.isNegative()
    const bIsNeg = other.isNegative()
    const signIsNeg = (aIsNeg && !bIsNeg) || (!aIsNeg && bIsNeg)
    const absA = aIsNeg ? this.neg() : this
    const absB = bIsNeg ? other.neg() : other
    const resultAbs = BigInt.divUnsigned(absA, absB)
    return signIsNeg ? resultAbs.neg() : resultAbs
  }

  @operator('%')
  mod(other: BigInt): BigInt {
    assert(!other.isZero(), '')
    return this.minus(this.div(other).times(other))
  }

  @operator('==')
  equals(other: BigInt): boolean {
    return BigInt.compare(this, other) == 0
  }

  @operator('!=')
  notEqual(other: BigInt): boolean {
    return !(this == other)
  }

  @operator('<')
  lt(other: BigInt): boolean {
    return BigInt.compare(this, other) == -1
  }

  @operator('>')
  gt(other: BigInt): boolean {
    return BigInt.compare(this, other) == 1
  }

  @operator('<=')
  le(other: BigInt): boolean {
    return !(this > other)
  }

  @operator('>=')
  ge(other: BigInt): boolean {
    return !(this < other)
  }

  @operator.prefix('-')
  neg(): BigInt {
    const result = new BigInt(this.length)
    for (let i = 0; i < this.length; i++) {
      result[i] = ~this[i]
    }
    let carry: u32 = 1
    for (let i = 0; i < result.length && carry != 0; i++) {
      const sum = <u32>result[i] + carry
      result[i] = <u8>(sum & 0xff)
      carry = sum >> 8
    }
    return result
  }

  @operator('|')
  bitOr(other: BigInt): BigInt {
    const maxLen = max(this.length, other.length)
    const result = new BigInt(maxLen)
    for (let i = 0; i < maxLen; i++) {
      const aByte = i < this.length ? this[i] : this.isNegative() ? 0xff : 0x00
      const bByte = i < other.length ? other[i] : other.isNegative() ? 0xff : 0x00
      result[i] = aByte | bByte
    }
    return result
  }

  @operator('&')
  bitAnd(other: BigInt): BigInt {
    const maxLen = max(this.length, other.length)
    const result = new BigInt(maxLen)
    for (let i = 0; i < maxLen; i++) {
      const aByte = i < this.length ? this[i] : this.isNegative() ? 0xff : 0x00
      const bByte = i < other.length ? other[i] : other.isNegative() ? 0xff : 0x00
      result[i] = aByte & bByte
    }
    return result
  }

  @operator('<<')
  leftShift(bits: u8): BigInt {
    if (bits == 0) return this
    const byteShift = bits / 8
    const bitShift = bits % 8
    const newLen = this.length + <i32>byteShift + 1
    const result = new BigInt(newLen)
    let carry = 0
    for (let i = 0; i < this.length; i++) {
      const cur = (this[i] << bitShift) | carry
      result[i + byteShift] = <u8>(cur & 0xff)
      carry = (cur >> 8) & 0xff
    }
    if (carry != 0) {
      result[this.length + byteShift] = <u8>carry
    }
    return result
  }

  @operator('>>')
  rightShift(bits: u8): BigInt {
    if (bits == 0) {
      return this
    }

    const byteShift = (bits >> 3) as i32
    const bitShift = bits & 0b111
    const negative = this.isNegative()
    const result = new BigInt(this.length)

    if (byteShift >= this.length) {
      for (let i = 0; i < this.length; i++) {
        result[i] = negative ? 0xff : 0x00
      }
      return result
    }

    let carry: u16 = 0
    for (let i = this.length - 1; i >= 0; i--) {
      let cur = <u16>(this[i] & 0xff)

      if (negative && i == this.length - 1) {
        cur |= 0xff00
      }

      cur |= carry << 8
      carry = cur & ((1 << bitShift) - 1)
      cur = cur >> bitShift
      const pos = i - byteShift

      if (pos >= 0) {
        result[pos] = <u8>(cur & 0xff)
      }
      if (i == 0) {
        break
      }
    }

    for (let i = this.length - 1; i >= this.length - byteShift; i--) {
      if (i >= 0 && i < result.length) {
        result[i] = negative ? 0xff : 0x00
      }
      if (i == 0) {
        break
      }
    }

    return result
  }

  pow(exp: u8): BigInt {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let base = this
    let e = exp
    let result = BigInt.fromI32(1)
    while (e > 0) {
      if ((e & 1) == 1) {
        result = result.times(base)
      }
      base = base.times(base) as this
      e >>= 1
    }
    return result
  }

  static compare(a: BigInt, b: BigInt): i32 {
    const aIsNeg = a.length > 0 && a[a.length - 1] >> 7 == 1
    const bIsNeg = b.length > 0 && b[b.length - 1] >> 7 == 1
    if (!aIsNeg && bIsNeg) {
      return 1
    }
    if (aIsNeg && !bIsNeg) {
      return -1
    }
    let aRelevantBytes = a.length
    while (
      aRelevantBytes > 0 &&
      ((!aIsNeg && a[aRelevantBytes - 1] == 0) || (aIsNeg && a[aRelevantBytes - 1] == 255))
    ) {
      aRelevantBytes -= 1
    }
    let bRelevantBytes = b.length
    while (
      bRelevantBytes > 0 &&
      ((!bIsNeg && b[bRelevantBytes - 1] == 0) || (bIsNeg && b[bRelevantBytes - 1] == 255))
    ) {
      bRelevantBytes -= 1
    }
    if (aRelevantBytes > bRelevantBytes) {
      return aIsNeg ? -1 : 1
    }
    if (bRelevantBytes > aRelevantBytes) {
      return aIsNeg ? 1 : -1
    }
    const relevantBytes = aRelevantBytes
    for (let i = 1; i <= relevantBytes; i++) {
      if (a[relevantBytes - i] < b[relevantBytes - i]) {
        return -1
      }
      if (a[relevantBytes - i] > b[relevantBytes - i]) {
        return 1
      }
    }
    return 0
  }

  private isNegative(): boolean {
    return this.length > 0 && (this[this.length - 1] & 0x80) == 0x80
  }

  static addUnsigned(a: BigInt, b: BigInt): BigInt {
    const maxLen = max(a.length, b.length)
    const result = new BigInt(maxLen + 1)
    let carry: u32 = 0
    for (let i = 0; i < maxLen; i++) {
      const ai = i < a.length ? a[i] : 0
      const bi = i < b.length ? b[i] : 0
      const sum = <u32>ai + <u32>bi + carry
      result[i] = <u8>(sum & 0xff)
      carry = sum >> 8
    }
    if (carry != 0) {
      result[maxLen] = <u8>carry
    }
    return result
  }

  static subUnsigned(a: BigInt, b: BigInt): BigInt {
    const result = new BigInt(a.length)
    let borrow: i32 = 0
    for (let i = 0; i < a.length; i++) {
      const ai = <i32>(i < a.length ? a[i] : 0)
      const bi = <i32>(i < b.length ? b[i] : 0)
      let diff = ai - bi - borrow
      borrow = 0
      if (diff < 0) {
        diff += 256
        borrow = 1
      }
      result[i] = <u8>(diff & 0xff)
    }
    return result
  }

  static mulUnsigned(a: BigInt, b: BigInt): BigInt {
    const result = new BigInt(a.length + b.length)
    for (let i = 0; i < a.length; i++) {
      let carry: u32 = 0
      for (let j = 0; j < b.length || carry != 0; j++) {
        const bj = j < b.length ? b[j] : 0
        const sum = <u32>result[i + j] + <u32>a[i] * <u32>bj + carry
        result[i + j] = <u8>(sum & 0xff)
        carry = sum >> 8
      }
    }
    return result
  }

  static divUnsigned(a: BigInt, b: BigInt): BigInt {
    if (b.isZero()) {
      assert(false, '')
      return BigInt.zero()
    }
    if (BigInt.compare(a, b) < 0) {
      return BigInt.zero()
    }

    let quotient = BigInt.zero()
    let remainder = BigInt.zero()

    for (let i = a.length - 1; i >= 0; i--) {
      remainder = remainder.leftShift(8)
      remainder = BigInt.addUnsigned(remainder, BigInt.fromI32(a[i]))

      let digit = BigInt.zero()
      while (BigInt.compare(remainder, b) >= 0) {
        remainder = BigInt.subUnsigned(remainder, b)
        digit = BigInt.addUnsigned(digit, BigInt.fromI32(1))
      }

      quotient = quotient.leftShift(8)
      quotient = BigInt.addUnsigned(quotient, digit)
    }

    return quotient
  }
}
