const SEPARATOR = ','

export interface Stringable {
  toString(): string
}

export interface Serializable {
  serialize(): string
}

export function serialize<T extends Stringable>(elem: T): string {
  // eslint-disable-next-line
  // @ts-ignore
  if (elem instanceof Serializable) return elem.serialize()
  return elem.toString()
}

export function serializeArray<T extends Stringable>(array: T[]): string {
  const serializedElems: (string | null)[] = []
  for (let i = 0; i < array.length; i++) {
    serializedElems.push(serialize(array[i]))
  }
  return 'Array(' + join(serializedElems) + ')'
}

export function join(lst: (string | null)[]): string {
  return lst.join(SEPARATOR)
}

/**
 * Parses a CSV string into an array of tokens, handling nested structures,
 * null values, and stripping one layer of outer parentheses if they wrap the entire string.
 *
 * @param csvString - String containing comma-separated values, nested structures (e.g., "(1,2)"), and nulls
 * @returns Array of strings (trimmed) and nulls, preserving internal nesting
 * @throws {Error} If parentheses are unbalanced
 */
export function parseCSV(csvString: string): (string | null)[] {
  const tokens: (string | null)[] = []
  const currentTokenChars: string[] = []
  const len = csvString.length
  let depth: i32 = 0
  let isEmpty = true

  let shouldStripOuter = false
  if (len > 1 && csvString.charAt(0) == '(' && csvString.charAt(len - 1) == ')') {
    let balance = 0
    let firstParenMatchesLast = true
    for (let k = 0; k < len; k++) {
      if (csvString.charAt(k) == '(') {
        balance++
      } else if (csvString.charAt(k) == ')') {
        balance--
      }
      if (balance == 0 && k < len - 1) {
        firstParenMatchesLast = false
        break
      }
    }
    if (firstParenMatchesLast && balance == 0) {
      shouldStripOuter = true
    }
  }

  for (let i = 0; i < len; i++) {
    const char = csvString.charAt(i)
    const charCode = char.charCodeAt(0)

    switch (charCode) {
      case '('.charCodeAt(0):
        if (shouldStripOuter && i == 0) {
          depth++
          break
        }
        depth++
        currentTokenChars.push(char)
        isEmpty = false
        break

      case ')'.charCodeAt(0):
        if (shouldStripOuter && i == len - 1) {
          depth--
          break
        }
        depth--
        if (depth < 0) throw new Error(`Unbalanced parentheses at position ${i}`)
        currentTokenChars.push(char)
        isEmpty = false
        break

      case SEPARATOR.charCodeAt(0):
        const isTopLevelComma = (shouldStripOuter && depth == 1) || (!shouldStripOuter && depth == 0)
        if (isTopLevelComma) {
          if (isEmpty) {
            tokens.push(null)
          } else {
            tokens.push(currentTokenChars.join('').trim())
          }
          currentTokenChars.length = 0
          isEmpty = true
        } else {
          currentTokenChars.push(char)
          isEmpty = false
        }
        break

      default:
        currentTokenChars.push(char)
        isEmpty = false
        break
    }
  }

  if (depth != 0) throw new Error('Unbalanced parentheses at the end of the string')

  if (len > 0) {
    if (isEmpty) {
      tokens.push(null)
    } else {
      tokens.push(currentTokenChars.join('').trim())
    }
  }

  return tokens
}

/**
 * Parses a CSV string into an array of strings, throwing an error if any null values are present.
 *
 * @param csvString - String containing comma-separated values
 * @returns Array of strings
 * @throws {Error} If null values are present
 */

export function parseCSVNotNullable(csvString: string): string[] {
  const tokens = parseCSV(csvString)
  if (tokens.some((token) => token === null)) throw new Error('Null value found in CSV string')

  return changetype<string[]>(tokens)
}
