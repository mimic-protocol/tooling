// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

import { bigIntToHex, bigIntToString, Serializable } from '../helpers'

import { ByteArray } from './ByteArray'
import { Bytes } from './Bytes'

const ASCII_CODE_ZERO = 48

/**
 * Represents an arbitrary-precision integer stored as a byte array.
 */
export class BigInt extends Uint8Array implements Serializable {
  private static readonly SERIALIZED_PREFIX: string = 'BigInt'
  /**
   * Creates a BigInt from a signed 32-bit integer (i32).
   */
  static fromI32(x: i32): BigInt {
    return BigInt.fromByteArray(ByteArray.fromI32(x))
  }

  /**
   * Creates a BigInt from an unsigned 32-bit integer (u32).
   */
  static fromU32(x: u32): BigInt {
    return BigInt.fromUnsignedBytes(ByteArray.fromU32(x))
  }

  /**
   * Creates a BigInt from a signed 64-bit integer (i64).
   */
  static fromI64(x: i64): BigInt {
    return BigInt.fromByteArray(ByteArray.fromI64(x))
  }

  /**
   * Creates a BigInt from an unsigned 64-bit integer (u64).
   */
  static fromU64(x: u64): BigInt {
    return BigInt.fromUnsignedBytes(ByteArray.fromU64(x))
  }

  /**
   * Converts a Bytes instance containing a signed integer to a BigInt.
   */
  static fromSignedBytes(bytes: Bytes): BigInt {
    return BigInt.fromByteArray(changetype<ByteArray>(bytes))
  }

  /**
   * Converts a ByteArray to a BigInt.
   */
  static fromByteArray(byteArray: ByteArray): BigInt {
    return changetype<BigInt>(byteArray)
  }

  /**
   * Converts an unsigned ByteArray to a BigInt, appending a zero byte for sign extension.
   */
  static fromUnsignedBytes(bytes: ByteArray): BigInt {
    const signedBytes = new BigInt(bytes.length + 1)
    for (let i = 0; i < bytes.length; i++) {
      signedBytes[i] = bytes[i]
    }
    signedBytes[bytes.length] = 0
    return signedBytes
  }

  /**
   * Parses a serialized representation of a BigInt and converts it to a BigInt.
   */
  static deserialize(serialized: string): BigInt {
    const isBigInt = serialized.startsWith(`${BigInt.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isBigInt) throw new Error('Invalid serialized BigInt')

    return BigInt.fromString(serialized.slice(BigInt.SERIALIZED_PREFIX.length + 1, -1))
  }

  /**
   * Parses a string representation of a number and converts it to a BigInt.
   * Supports decimal and hexadecimal formats.
   */
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
    let parsingFraction = false
    let fractionDigits = 0

    if (isHex) {
      let hexPart = str.substring(index)
      if (hexPart.length === 0) return BigInt.zero()

      for (let i = 0; i < hexPart.length; i++) {
        const c = hexPart.charAt(i)
        if (!((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f'))) {
          throw new Error(`Invalid character in hex string: '${c}'`)
        }
      }

      if (hexPart.length % 2 === 1) hexPart = '0' + hexPart

      const byteCount = hexPart.length >>> 1
      const bytes = new ByteArray(byteCount)

      for (let i = 0; i < byteCount; i++) {
        const start = hexPart.length - 2 * (i + 1)
        const hexByte = hexPart.substr(start, 2)
        bytes[i] = <u8>parseInt(hexByte, 16)
      }

      result = BigInt.fromUnsignedBytes(bytes)
      if (isNegative && !result.isZero()) result = result.neg()

      return result
    } else {
      while (index < str.length) {
        let c = str.charAt(index)

        if (!parsingExponent) {
          if (c === '.') {
            fractionDigits = 0
            parsingFraction = true
            index++
            continue
          }

          if (c === 'e' || c === 'E') {
            parsingExponent = true
            index++

            if (index < str.length && (str.charAt(index) === '+' || str.charAt(index) === '-')) {
              if (str.charAt(index) === '-') exponentNegative = true
              index++
            }

            continue
          }

          if (c < '0' || c > '9') throw new Error(`Invalid character in decimal string: '${c}'`)
          let digit = c.charCodeAt(0) - '0'.charCodeAt(0)
          result = result.times(BigInt.fromI32(10)).plus(BigInt.fromI32(digit))

          if (parsingFraction) fractionDigits++
        } else {
          if (c < '0' || c > '9') throw new Error(`Invalid character in exponent string: '${c}'`)
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

  static fromStringDecimal(str: string, precision: u8): BigInt {
    if (str === '0') {
      return BigInt.fromI32(0)
    }

    const parts = str.split('.')
    if (parts.length > 2) throw new Error('Invalid str. Received: ' + str)

    const isNegative = parts[0].startsWith('-')
    const wholePart = isNegative ? parts[0].substring(1) : parts[0]

    let result = BigInt.fromString(wholePart)
    result = result.upscale(precision)

    if (parts.length > 1 && parts[1].length > 0) {
      const decimalPart = parts[1].padEnd(precision, '0').substring(0, precision)
      result = result.plus(BigInt.fromString(decimalPart))
    }

    return isNegative ? result.neg() : result
  }

  /**
   * Returns a BigInt initialized to zero.
   */
  static zero(): BigInt {
    return BigInt.fromI32(0)
  }

  static addUnsigned(a: BigInt, b: BigInt): BigInt {
    if (a.isZero()) return b.clone()
    if (b.isZero()) return a.clone()

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
    if (carry != 0) result[maxLen] = <u8>carry
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
    if (a.length < b.length) return BigInt.mulUnsigned(b, a)
    if (b.length === 1 && b[0] === 2) return a.leftShift(1)

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
    if (BigInt.compare(a, b) < 0) return BigInt.zero()

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

  static compare(a: BigInt, b: BigInt): i32 {
    const aIsNeg = a.length > 0 && a[a.length - 1] >> 7 == 1
    const bIsNeg = b.length > 0 && b[b.length - 1] >> 7 == 1
    if (!aIsNeg && bIsNeg) return 1
    if (aIsNeg && !bIsNeg) return -1

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

    if (aRelevantBytes > bRelevantBytes) return aIsNeg ? -1 : 1
    if (bRelevantBytes > aRelevantBytes) return aIsNeg ? 1 : -1

    const relevantBytes = aRelevantBytes
    for (let i = 1; i <= relevantBytes; i++) {
      if (a[relevantBytes - i] < b[relevantBytes - i]) return -1
      if (a[relevantBytes - i] > b[relevantBytes - i]) return 1
    }

    return 0
  }

  isNegative(): boolean {
    return this.length > 0 && (this[this.length - 1] & 0x80) == 0x80
  }

  isZero(): boolean {
    if (this.length == 0) return true

    for (let i = 0; i < this.length; i++) {
      if (this[i] !== 0) return false
    }
    return true
  }

  isI32(): boolean {
    return BigInt.fromI32(i32.MIN_VALUE) <= this && this <= BigInt.fromI32(i32.MAX_VALUE)
  }

  abs(): BigInt {
    return this < BigInt.fromI32(0) ? this.neg() : this
  }

  pow(exp: u8): BigInt {
    if (exp === 0) return BigInt.fromI32(1)
    if (exp === 1) return this.clone()
    if (exp === 2) return this.times(this)

    let base = this.clone()
    let e = exp
    let result = BigInt.fromI32(1)

    while (e > 0) {
      if ((e & 1) == 1) {
        result = result.times(base)
      }
      base = base.times(base)
      e >>= 1
    }
    return result
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

  upscale(precision: u8): BigInt {
    return this.times(BigInt.fromI32(10).pow(precision))
  }

  downscale(precision: u8): BigInt {
    return this.div(BigInt.fromI32(10).pow(precision))
  }

  clone(): BigInt {
    const clone = new BigInt(this.length)
    memory.copy(clone.dataStart, this.dataStart, this.length)
    return clone
  }

  subarray(start: i32, end: i32): BigInt {
    const length = end - start
    const result = new BigInt(length)
    memory.copy(result.dataStart, this.dataStart + start, length)
    return result
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
    if (other.isZero() || this.isZero()) return BigInt.zero()

    if (other.length == 1) {
      if (other[0] == 1) return this.clone()
      if (other[0] == 2) return this.leftShift(1)
      if (other[0] == 4) return this.leftShift(2)
      if (other[0] == 8) return this.leftShift(3)
    }

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
    if (bits == 0) return this

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
      if (i == 0) break
    }

    for (let i = this.length - 1; i >= this.length - byteShift; i--) {
      if (i >= 0 && i < result.length) {
        result[i] = negative ? 0xff : 0x00
      }
      if (i == 0) break
    }

    return result
  }

  toBytes(): Bytes {
    return Bytes.fromUint8Array(changetype<Uint8Array>(this))
  }

  toI32(): i32 {
    const byteArray = this.toBytes()
    return byteArray.toI32()
  }

  toU32(): u32 {
    const byteArray = this.toBytes()
    return byteArray.toU32()
  }

  toI64(): i64 {
    const byteArray = this.toBytes()
    return byteArray.toI64()
  }

  toU64(): u64 {
    const byteArray = this.toBytes()
    return byteArray.toU64()
  }

  toHex(): string {
    return bigIntToHex(this)
  }

  toHexString(): string {
    return bigIntToHex(this)
  }

  toString(): string {
    return bigIntToString(this)
  }

  toStringDecimal(precision: u8): string {
    if (this.isZero()) return '0'

    const isNegative = this.isNegative()
    const absAmount = isNegative ? this.neg() : this

    const str = absAmount.toString()
    if (str.length <= (precision as i32)) {
      let decimalPart = str.padStart(precision, '0')

      let lastNonZero = decimalPart.length - 1
      while (lastNonZero >= 0 && decimalPart.charCodeAt(lastNonZero) === ASCII_CODE_ZERO) lastNonZero--

      decimalPart = decimalPart.substring(0, lastNonZero + 1)
      return (isNegative ? '-' : '') + '0' + (decimalPart.length ? '.' + decimalPart : '')
    }

    const wholePart = str.slice(0, str.length - precision)
    let decimalPart = str.slice(str.length - precision)

    // Remove trailing zeros manually
    let lastNonZero = decimalPart.length - 1
    while (lastNonZero >= 0 && decimalPart.charCodeAt(lastNonZero) === ASCII_CODE_ZERO) lastNonZero--

    decimalPart = decimalPart.substring(0, lastNonZero + 1)

    // If the decimal part is empty, return only the whole part
    return decimalPart.length > 0
      ? `${isNegative ? '-' : ''}${wholePart}.${decimalPart}`
      : `${isNegative ? '-' : ''}${wholePart}`
  }

  serialize(): string {
    return `${BigInt.SERIALIZED_PREFIX}(${this.toString()})`
  }
}
