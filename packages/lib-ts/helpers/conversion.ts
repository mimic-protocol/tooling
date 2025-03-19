import { BigInt, Bytes } from '../common/'

export function bytesToString(bytes: Uint8Array): string {
  return String.UTF8.decodeUnsafe(bytes.dataStart, bytes.length)
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '0x'
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function bigIntToString(value: BigInt): string {
  if (value.isZero()) {
    return '0'
  }

  const isNegative = value.lt(BigInt.zero())
  let mag = isNegative ? value.neg() : value.clone()
  const digits = new Array<i32>()

  while (!mag.isZero()) {
    let carry = 0

    for (let i = mag.length - 1; i >= 0; i--) {
      const cur = (carry << 8) + mag[i]
      const q = cur / 10
      const r = cur % 10
      mag[i] = <u8>q
      carry = r
    }

    digits.push(0x30 + carry)

    while (mag.length > 1 && mag[mag.length - 1] == 0) {
      mag = mag.subarray(0, mag.length - 1)
    }
  }

  if (isNegative) {
    digits.push('-'.charCodeAt(0))
  }

  digits.reverse()
  let out = ''

  for (let i = 0; i < digits.length; i++) {
    out += String.fromCharCode(digits[i])
  }
  return out
}

export function bigIntToHex(bigInt: Uint8Array): string {
  return bytesToHex(bigInt)
}

export function stringToH160(s: string): Bytes {
  const bytes = Bytes.fromHexString(s)
  if (bytes.length !== 20) throw new Error(`Invalid H160 string ${s} (expected length 20)`)
  return bytes
}
