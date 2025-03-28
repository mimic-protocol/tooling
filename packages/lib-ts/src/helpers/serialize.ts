const SEPARATOR = ','

interface Stringable {
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
 * Parses a CSV string into an array of tokens, handling nested structures and null values.
 *
 * @param csvString - String containing comma-separated values, nested structures (e.g., "Array(1,2)"), and nulls
 * @returns Array of strings and nulls, preserving nested structures as single strings
 * @throws {Error} If parentheses are unbalanced
 *
 * @example
 * parseCSV("one,,three")     // ["one", null, "three"]
 * parseCSV("Array(1,2),3")   // ["Array(1,2)", "3"]
 */
export function parseCSV(csvString: string): (string | null)[] {
  const tokens: (string | null)[] = []
  const currentTokenChars: string[] = []
  let parenthesisDepth: i32 = 0
  let isEmpty: boolean = true

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString.charAt(i)
    const charCode = char.charCodeAt(0)

    switch (charCode) {
      case '('.charCodeAt(0):
        parenthesisDepth++
        currentTokenChars.push(char)
        isEmpty = false
        break

      case ')'.charCodeAt(0):
        parenthesisDepth--
        if (parenthesisDepth < 0) throw new Error(`Unbalanced brackets at position ${i}`)
        currentTokenChars.push(char)
        isEmpty = false
        break

      case SEPARATOR.charCodeAt(0):
        if (parenthesisDepth === 0) {
          isEmpty ? tokens.push(null) : tokens.push(currentTokenChars.join(''))
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

  if (parenthesisDepth !== 0) {
    throw new Error('Unbalanced brackets at the end of the string')
  }

  if (csvString.length > 0) {
    isEmpty ? tokens.push(null) : tokens.push(currentTokenChars.join(''))
  }

  return tokens
}
