import { environment } from '../environment'
import { evm } from '../evm'
import { EVM_NATIVE_ADDRESS } from '../helpers'
import { Address, ChainId, EvmDecodeParam } from '../types'

import { BlockchainToken } from './BlockchainToken'
import { Token } from './Token'

/**
 * Represents an ERC-20 token on a blockchain network including data like symbol, decimals, and address.
 */
export class ERC20Token extends BlockchainToken {
  public static readonly EMPTY_DECIMALS: u8 = u8.MAX_VALUE
  public static readonly EMPTY_SYMBOL: string = ''

  private _timestamp: Date | null = null

  /**
   * Creates a Token instance representing the native token of the specified chain.
   * @param chainId - The blockchain network identifier
   * @returns A new Token instance for the native token
   */
  static native(chainId: ChainId): ERC20Token {
    switch (chainId) {
      case ChainId.ETHEREUM:
      case ChainId.BASE:
      case ChainId.ARBITRUM:
      case ChainId.OPTIMISM:
        return ERC20Token.fromString(EVM_NATIVE_ADDRESS, chainId, 18, 'ETH')
      case ChainId.GNOSIS:
        return ERC20Token.fromString(EVM_NATIVE_ADDRESS, chainId, 18, 'xDAI')
      case ChainId.SONIC:
        return ERC20Token.fromString(EVM_NATIVE_ADDRESS, chainId, 18, 'SONIC')
      default:
        throw new Error(`Unsupported chainId: ${chainId}`)
    }
  }

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
    decimals: u8 = ERC20Token.EMPTY_DECIMALS,
    symbol: string = ERC20Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ): ERC20Token {
    return new ERC20Token(address, chainId, decimals, symbol, timestamp)
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
    decimals: u8 = ERC20Token.EMPTY_DECIMALS,
    symbol: string = ERC20Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ): ERC20Token {
    return ERC20Token.fromAddress(Address.fromString(address), chainId, decimals, symbol, timestamp)
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
    decimals: u8 = ERC20Token.EMPTY_DECIMALS,
    symbol: string = ERC20Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ) {
    if (!address.isEVM()) throw new Error(`Address ${address} must be an EVM address.`)
    super(address, decimals, symbol, chainId)
    this._timestamp = timestamp

    // Ensure symbol and decimals are set for native or denomination tokens.
    // Since queries return only the address and chainId, missing metadata must be filled
    // to prevent the symbol and decimals getters from failing for native tokens.
    const hasMissingSymbol = this._symbol === ERC20Token.EMPTY_SYMBOL
    const hasMissingDecimals = this._decimals === ERC20Token.EMPTY_DECIMALS
    const hasMissingSymbolOrDecimals = hasMissingSymbol || hasMissingDecimals
    if (address.isNative() && hasMissingSymbolOrDecimals) {
      const nativeToken = ERC20Token.native(this.chainId)
      if (hasMissingSymbol) this._symbol = nativeToken.symbol
      if (hasMissingDecimals) this._decimals = nativeToken.decimals
    }
  }

  /**
   * Gets the token’s symbol (e.g., "ETH", "USDC").
   * If the symbol was not provided during construction, it will be lazily fetched
   * via a `evmCallQuery` to the token’s `symbol()` function (ERC-20 standard, selector `0x95d89b41`).
   * The fetched symbol is cached in the instance for future accesses.
   * @returns A string containing the token symbol.
   */
  get symbol(): string {
    if (this._symbol === ERC20Token.EMPTY_SYMBOL) {
      const response = environment.evmCallQuery(this.address, this.chainId, '0x95d89b41', this._timestamp)
      this._symbol = evm.decode(new EvmDecodeParam('string', response))
    }
    return this._symbol
  }

  /**
   * Gets the token’s decimals (number of decimal places used).
   * If decimals were not provided during construction, they will be lazily fetched
   * via a `evmCallQuery` to the token’s `decimals()` function (ERC-20 standard, selector `0x313ce567`).
   * The fetched value is parsed to `u8` and cached for future accesses.
   * @returns A `u8` representing the number of decimals of the token.
   */
  get decimals(): u8 {
    if (this._decimals == ERC20Token.EMPTY_DECIMALS) {
      const result = environment.evmCallQuery(this.address, this.chainId, '0x313ce567', this._timestamp)
      this._decimals = u8.parse(evm.decode(new EvmDecodeParam('uint8', result)))
    }
    return this._decimals
  }

  /**
   * Checks if this token is equal to another token.
   * ERC20 Tokens are considered equal if they have the same address on the same chain.
   * @param other - The token to compare with
   * @returns True if both tokens represent the same asset
   */
  equals(other: Token): boolean {
    return other instanceof ERC20Token && super.equals(other) && this.hasChain((other as ERC20Token).chainId)
  }

  /**
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  isNative(): boolean {
    return this.equals(ERC20Token.native(this.chainId))
  }
}
