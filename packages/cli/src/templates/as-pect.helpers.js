export class StateManager {
  loggingEnabled = false
  tokenPricesMap = new Map()
  relevantTokensMap = new Map()
  contractCallMap = new Map()

  reset() {
    this.loggingEnabled = false
    this.tokenPricesMap.clear()
    this.relevantTokensMap.clear()
    this.contractCallMap.clear()
  }
}

export class IBigInt {
  static SERIALIZED_PREFIX = 'BigInt'
  value = 0n

  static parse(serialized) {
    const isBigInt = serialized.startsWith(`${IBigInt.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isBigInt) throw new Error('Invalid serialized BigInt')
    return new IBigInt(serialized.slice(IBigInt.SERIALIZED_PREFIX.length + 1, -1))
  }

  constructor(value) {
    this.value = BigInt(value)
  }

  serialize() {
    return `${IBigInt.SERIALIZED_PREFIX}(${this.value.toString()})`
  }

  equals(other) {
    if (!(other instanceof IBigInt)) return false
    return this.value === other.value
  }
}

export class IToken {
  static SERIALIZED_PREFIX = 'Token'
  symbol = ''
  address = ''
  chainId = 0
  decimals = 0

  static parse(serialized) {
    const isToken = serialized.startsWith(`${IToken.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isToken) throw new Error('Invalid serialized token')

    const elements = parseCSV(serialized.slice(IToken.SERIALIZED_PREFIX.length + 1, -1))
    const areNull = elements.some((element) => element === null)
    if (areNull) throw new Error('Invalid serialized token')

    const symbol = elements[0]
    const address = elements[1]
    const chainId = parseInt(elements[2])
    const decimals = parseInt(elements[3])

    return new IToken(symbol, address, chainId, decimals)
  }

  constructor(symbol, address, chainId, decimals) {
    this.symbol = symbol
    this.address = address
    this.chainId = chainId
    this.decimals = decimals
  }

  serialize() {
    return `${IToken.SERIALIZED_PREFIX}(${this.symbol},${this.address},${this.chainId},${this.decimals})`
  }

  equals(other) {
    if (!(other instanceof IToken)) return false
    return this.address === other.address && this.chainId === other.chainId
  }
}

export class ITokenAmount {
  static SERIALIZED_PREFIX = 'TokenAmount'
  token = new IToken()
  amount = new IBigInt(0)

  static parse(serialized) {
    const isTokenAmount = serialized.startsWith(`${ITokenAmount.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isTokenAmount) throw new Error('Invalid serialized token amount')

    const elements = parseCSV(serialized.slice(ITokenAmount.SERIALIZED_PREFIX.length + 1, -1))
    const areNull = elements.some((element) => element === null)
    if (areNull) throw new Error('Invalid serialized token amount')

    const token = IToken.parse(elements[0])
    const amount = IBigInt.parse(elements[1])

    return new ITokenAmount(token, amount)
  }

  constructor(token, amount) {
    this.token = token
    this.amount = amount
  }

  serialize() {
    return `${ITokenAmount.SERIALIZED_PREFIX}(${this.token.serialize()},${this.amount.serialize()})`
  }

  equals(other) {
    if (!(other instanceof ITokenAmount)) return false
    return this.token.equals(other.token) && this.amount.equals(other.amount)
  }
}

export class IArray {
  static SERIALIZED_PREFIX = 'Array'
  items = []

  static parse(serialized) {
    const isArray = serialized.startsWith(`${IArray.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isArray) throw new Error('Invalid serialized array')

    const elements = parseCSV(serialized.slice(IArray.SERIALIZED_PREFIX.length + 1, -1))

    return new IArray(elements)
  }

  constructor(items) {
    this.items = items
  }

  serialize() {
    return `${IArray.SERIALIZED_PREFIX}(${this.items.join(',')})`
  }
}

export const LIST_TYPES = {
  ALLOW: 0,
  DENY: 1,
}

export function parseCSV(csvString) {
  const SEPARATOR = ','
  const tokens = []
  const currentTokenChars = []
  let parenthesisDepth = 0
  let isEmpty = true

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString.charAt(i)

    switch (char) {
      case '(':
        parenthesisDepth++
        currentTokenChars.push(char)
        isEmpty = false
        break

      case ')':
        parenthesisDepth--
        if (parenthesisDepth < 0) throw new Error(`Unbalanced brackets at position ${i}`)
        currentTokenChars.push(char)
        isEmpty = false
        break

      case SEPARATOR:
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

  if (parenthesisDepth !== 0) throw new Error('Unbalanced brackets at the end of the string')
  if (csvString.length > 0) isEmpty ? tokens.push(null) : tokens.push(currentTokenChars.join(''))
  return tokens
}
