import { Address, ChainId } from '../types'

/**
 * Represents a token on a blockchain network including data like symbol, decimals, and address.
 * Supports both ERC-20, SPL, and denomination tokens.
 */
export abstract class Token {
  protected _symbol: string
  protected _address: Address
  protected _decimals: u8

  /**
   * Creates a new Token instance.
   * @param address - The address of the token
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   */
  constructor(address: Address, decimals: u8, symbol: string) {
    this._address = address
    this._decimals = decimals
    this._symbol = symbol
  }

  /**
   * Gets the contract address of the token.
   * The address is returned as a cloned `Address` object to ensure immutability of the internal state.
   * @returns A cloned `Address` object representing the token’s address.
   */
  get address(): Address {
    return this._address.clone()
  }

  /**
   * Gets the token’s symbol (e.g., "ETH", "USDC").
   * @returns A string containing the token symbol.
   */
  get symbol(): string {
    return this._symbol
  }

  /**
   * Gets the token’s decimals (number of decimal places used).
   * @returns A `u8` representing the number of decimals of the token.
   */
  get decimals(): u8 {
    return this._decimals
  }

  /**
   * Checks if this token is equal to another token.
   * Tokens are considered equal if they have the same address.
   * @param other - The token to compare with
   * @returns True if both tokens have the same address
   */
  equals(other: Token): boolean {
    return this.address.equals(other.address)
  }

  /**
   * Checks if this token is the USD denomination.
   * @returns True if the token is the USD denomination
   */
  abstract isUSD(): boolean

  /**
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  abstract isNative(): boolean

  /**
   * Checks if this token belongs to the requested chain.
   * @param chain - The chain ID asking for
   * @returns True if the token belongs to the requested chain
   */
  abstract hasChain(chain: ChainId): boolean

  /**
   * Tells the string representation of this token.
   * @returns The string representation of the token
   */
  abstract toString(): string
}

@json
export class SerializableToken {
  constructor(
    public address: string,
    public chainId: i32
  ) {}
}
