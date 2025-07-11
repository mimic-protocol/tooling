export function bytesToString(bytes: Uint8Array): string {
  return String.UTF8.decodeUnsafe(bytes.dataStart, bytes.length)
}

export function bytesToHexString(bytes: Uint8Array): string {
  let hex = '0x'
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}

export function areAllZeros(str: string): boolean {
  for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) !== 48) return false
  return true
}

export function normalizeScientificNotation(input: string): string {
  let len = input.length
  if (len === 0) return input

  let i = 0
  let sign = ''
  if (input.charAt(0) === '-' || input.charAt(0) === '+') {
    sign = input.charAt(0)
    i++
  }

  let intPart = ''
  let fracPart = ''
  let exponentStr = ''
  let hasDot = false
  let hasExponent = false
  let exponentNegative = false

  // Parse integer & fraction parts
  for (; i < len; i++) {
    const c = input.charAt(i)
    if (c === '.') {
      hasDot = true
      continue
    }

    if (c === 'e' || c === 'E') {
      hasExponent = true
      i++
      break
    }

    if (hasDot) {
      fracPart += c
    } else {
      intPart += c
    }
  }

  // Parse exponent if present
  if (hasExponent) {
    if (i < len && (input.charAt(i) === '+' || input.charAt(i) === '-')) {
      exponentNegative = input.charAt(i) === '-'
      i++
    }

    for (; i < len; i++) {
      const char = input.charAt(i)
      if (char < '0' || char > '9') throw new Error(`Invalid character in exponent part: ${char}`)
      exponentStr += char
    }
  }

  if (exponentStr.length === 0) return input

  const exponent = I32.parseInt(exponentStr)
  const fullDigits = intPart + fracPart
  const shift = exponentNegative ? -exponent : exponent
  const newDecimalPos = intPart.length + shift

  if (newDecimalPos <= 0) {
    const zeros = '0'.repeat(-newDecimalPos)
    return sign + '0.' + zeros + fullDigits
  } else if (newDecimalPos >= fullDigits.length) {
    const zeros = '0'.repeat(newDecimalPos - fullDigits.length)
    return sign + fullDigits + zeros
  } else {
    return sign + fullDigits.substring(0, newDecimalPos) + '.' + fullDigits.substring(newDecimalPos)
  }
}

export function isHex(str: string, strict: boolean = false): boolean {
  const hasPrefix = str.startsWith('0x')

  if (strict && !hasPrefix) return false

  const value = hasPrefix ? str.slice(2) : str

  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    const isDigit = c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)
    const isLetter =
      (c >= 'a'.charCodeAt(0) && c <= 'f'.charCodeAt(0)) || (c >= 'A'.charCodeAt(0) && c <= 'F'.charCodeAt(0))
    if (!(isDigit || isLetter)) return false
  }

  return true
}
