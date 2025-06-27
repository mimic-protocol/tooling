import { environment } from '../environment'
import { evm } from '../evm'
import { join, NATIVE_ADDRESS, parseCSV, Serializable, serialize } from '../helpers'
import { Address, ChainId, EvmDecodeParam } from '../types'

/**
 * Represents a token on a blockchain network with metadata like symbol, decimals, and address.
 * Supports both ERC-20 tokens and native tokens with automatic metadata resolution.
 */
export class Token implements Serializable {
  public static readonly EMPTY_DECIMALS: u8 = u8.MAX_VALUE
  public static readonly EMPTY_SYMBOL: string = ''
  private static readonly SERIALIZED_PREFIX: string = 'Token'

  private _symbol: string
  private _address: Address
  private _chainId: ChainId
  private _decimals: u8
  private _timestamp: Date | null = null

  /**
   * Creates a Token instance from an Address object.
   * @param address - The contract address of the token
   * @param chainId - The blockchain network identifier
   * @param decimals - Number of decimal places (optional, will be queried if not provided)
   * @param symbol - Token symbol (optional, will be queried if not provided)
   * @param timestamp - Timestamp for historical queries (optional)
   * @returns A new Token instance
   */
  static fromAddress(
    address: Address,
    chainId: ChainId,
    decimals: u8 = Token.EMPTY_DECIMALS,
    symbol: string = Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ): Token {
    return new Token(address, chainId, decimals, symbol, timestamp)
  }

  /**
   * Creates a Token instance from a string address.
   * @param address - The contract address as a hex string
   * @param chainId - The blockchain network identifier
   * @param decimals - Number of decimal places (optional, will be queried if not provided)
   * @param symbol - Token symbol (optional, will be queried if not provided)
   * @param timestamp - Timestamp for historical queries (optional)
   * @returns A new Token instance
   */
  static fromString(
    address: string,
    chainId: ChainId,
    decimals: u8 = Token.EMPTY_DECIMALS,
    symbol: string = Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ): Token {
    return Token.fromAddress(Address.fromString(address), chainId, decimals, symbol, timestamp)
  }

  /**
   * Creates a Token instance representing the native token of the specified chain.
   * @param chainId - The blockchain network identifier
   * @returns A new Token instance for the native token
   */
  static native(chainId: ChainId): Token {
    switch (chainId) {
      case ChainId.ETHEREUM:
      case ChainId.OPTIMISM:
        return Token.fromString(NATIVE_ADDRESS, chainId, 18, 'ETH')
      case ChainId.POLYGON:
        return Token.fromString(NATIVE_ADDRESS, chainId, 18, 'POL')
      default:
        throw new Error(`Unsupported chainId: ${chainId}`)
    }
  }

  /**
   * Parses a serialized Token string and creates a Token instance.
   * @param serialized - The serialized token string in format: Token(address,chainId)
   * @returns A new Token instance parsed from the serialized data
   */
  static parse(serialized: string): Token {
    const isToken = serialized.startsWith(`${Token.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isToken) throw new Error('Invalid serialized token')

    const elements = parseCSV(serialized.slice(Token.SERIALIZED_PREFIX.length + 1, -1))
    const areNull = elements.some((element) => element === null)
    if (areNull) throw new Error('Invalid serialized token')

    const address = elements[0]!
    const chainId = i32.parse(elements[1]!)

    return Token.fromString(address, chainId)
  }

  /**
   * Creates a new Token instance.
   * @param address - The contract address of the token
   * @param chainId - The blockchain network identifier
   * @param decimals - Number of decimal places (optional, will be queried if not provided)
   * @param symbol - Token symbol (optional, will be queried if not provided)
   * @param timestamp - Timestamp for historical queries (optional)
   */
  constructor(
    address: Address,
    chainId: ChainId,
    decimals: u8 = Token.EMPTY_DECIMALS,
    symbol: string = Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ) {
    this._address = address
    this._chainId = chainId
    this._timestamp = timestamp
    this._symbol = symbol
    this._decimals = decimals
    // Ensure symbol and decimals are set for native tokens.
    // Since queries return only the address and chainId, missing metadata must be filled
    // to prevent the symbol and decimals getters from failing for native tokens
    if (
      this._address.equals(Address.fromString(NATIVE_ADDRESS)) &&
      (this._symbol === Token.EMPTY_SYMBOL || this._decimals === Token.EMPTY_DECIMALS)
    ) {
      const nativeToken = Token.native(this._chainId)
      if (this._symbol === Token.EMPTY_SYMBOL) {
        this._symbol = nativeToken.symbol
      }
      if (this._decimals === Token.EMPTY_DECIMALS) {
        this._decimals = nativeToken.decimals
      }
    }
  }

  get address(): Address {
    return this._address.clone()
  }

  get chainId(): ChainId {
    return this._chainId
  }

  get symbol(): string {
    if (this._symbol === Token.EMPTY_SYMBOL) {
      const response = environment.contractCall(this.address, this.chainId, this._timestamp, '0x95d89b41')
      this._symbol = evm.decode(new EvmDecodeParam('string', response))
    }
    return this._symbol
  }

  get decimals(): u8 {
    if (this._decimals == Token.EMPTY_DECIMALS) {
      const result = environment.contractCall(this.address, this.chainId, this._timestamp, '0x313ce567')
      this._decimals = u8.parse(evm.decode(new EvmDecodeParam('uint8', result)))
    }
    return this._decimals
  }

  set decimals(value: u8) {
    this._decimals = value
  }

  set symbol(value: string) {
    this._symbol = value
  }

  set timestamp(value: Date) {
    this._timestamp = value
  }

  /**
   * Checks if this token is equal to another token.
   * Tokens are considered equal if they have the same address on the same chain.
   * @param other - The token to compare with
   * @returns True if both tokens represent the same asset
   */
  equals(other: Token): boolean {
    const isSameChain = this.chainId === other.chainId
    const isSameAddress = this.address.equals(other.address)
    return isSameChain && isSameAddress
  }

  /**
   * Returns the string representation of this token.
   * @returns The token symbol
   */
  toString(): string {
    return this.symbol
  }

  serialize(): string {
    return `${Token.SERIALIZED_PREFIX}(${join([serialize(this.address), serialize(this.chainId)])})`
  }
}
