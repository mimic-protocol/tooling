import { environment } from '../environment'
import { SVM_NATIVE_ADDRESS } from '../helpers'
import { log } from '../log'
import { svm } from '../svm'
import { Address, ChainId, SvmMint, SvmPdaSeed, SvmTokenMetadataData } from '../types'

import { BlockchainToken } from './BlockchainToken'
import { Token } from './Token'

/**
 * Represents a SPL token on the Solana network including data like symbol, decimals, and address.
 */
export class SPLToken extends BlockchainToken {
  /**
   * Creates a Token instance representing the native SOL token.
   * @returns A new Token instance for the native token
   */
  static native(): SPLToken {
    return SPLToken.fromString(SVM_NATIVE_ADDRESS, ChainId.SOLANA_MAINNET, 9, 'SOL')
  }

  /**
   * Creates a Token instance from an Address object.
   * @param address - The token mint address
   * @param chainId - The blockchain network identifier (optional)
   * @param decimals - Number of decimal places (optional)
   * @param symbol - Token symbol (optional)
   * @returns A new Token instance
   */
  static fromAddress(
    address: Address,
    chainId: ChainId = ChainId.SOLANA_MAINNET,
    decimals: u8 = SPLToken.EMPTY_DECIMALS,
    symbol: string = SPLToken.EMPTY_SYMBOL
  ): SPLToken {
    if (chainId != ChainId.SOLANA_MAINNET) throw new Error(`SPL tokens are only supported for Solana mainnet.`)
    return new SPLToken(address, decimals, symbol)
  }

  /**
   * Creates a Token instance from a string address.
   * @param address - The token mint address as a base58 string
   * @param chainId - The blockchain network identifier (optional)
   * @param decimals - Number of decimal places (optional)
   * @param symbol - Token symbol (optional)
   * @returns A new Token instance
   */
  static fromString(
    address: string,
    chainId: ChainId = ChainId.SOLANA_MAINNET,
    decimals: u8 = SPLToken.EMPTY_DECIMALS,
    symbol: string = SPLToken.EMPTY_SYMBOL
  ): SPLToken {
    return SPLToken.fromAddress(Address.fromString(address), chainId, decimals, symbol)
  }

  /**
   * Creates a new Token instance.
   * @param address - The token mint address
   * @param decimals - Number of decimal places
   * @param symbol - Token symbol
   */
  constructor(address: Address, decimals: u8 = SPLToken.EMPTY_DECIMALS, symbol: string = SPLToken.EMPTY_SYMBOL) {
    if (!address.isSVM()) throw new Error(`Address ${address} must be an SVM address.`)
    super(address, decimals, symbol, ChainId.SOLANA_MAINNET)
  }

  /**
   * Gets the token’s decimals (number of decimal places used).
   * If decimals were not provided during construction, they will be lazily fetched
   * The fetched value is parsed to `u8` and cached for future accesses.
   * @returns A `u8` representing the number of decimals of the token.
   */
  get decimals(): u8 {
    if (this._decimals == SPLToken.EMPTY_DECIMALS) this._getDecimals()
    return this._decimals
  }

  /**
   * Gets the token’s symbol (e.g., "SOL", "USDC").
   * If the symbol was not provided during construction, it will be lazily fetched
   * If the token doesn't have a symbol (TokenMetadata standard), an abbreviated address is returned
   * The symbol is cached in the instance for future accesses.
   * @returns A string containing the token symbol.
   */
  get symbol(): string {
    if (this._symbol == SPLToken.EMPTY_SYMBOL) this._getSymbol()
    return this._symbol
  }

  /**
   * Internal method to fetch and cache the token decimals.
   * Performs an SVM accounts info query to get the mint data.
   * @private
   */
  private _getDecimals(): void {
    const result = environment.svmAccountsInfoQuery([this.address])
    if (result.isError) {
      log.warning(
        `Failed to get decimals for token ${this.address.toString()} on chain ${this.chainId.toString()}: ${result.error}`
      )
      this._decimals = SPLToken.EMPTY_DECIMALS
      return
    }
    const decimals = SvmMint.fromHex(result.unwrap().accountsInfo[0].data).decimals
    this._decimals = decimals
  }

  /**
   * Internal method to fetch and cache the token symbol.
   * Performs an SVM accounts info query to get the token metadata.
   * @private
   */
  private _getSymbol(): void {
    const result = environment.svmAccountsInfoQuery([this.getMetadataAddress()])
    if (result.isError) {
      log.warning(
        `Failed to get symbol for token ${this.address.toString()} on chain ${this.chainId.toString()}: ${result.error}`
      )
      this._symbol = SPLToken.EMPTY_SYMBOL
      return
    }
    const data = result.unwrap().accountsInfo[0].data
    // Return placeholder symbol from address if TokenMetadata standard is not used
    this._symbol =
      data === '0x'
        ? `${this.address.toString().slice(0, 5)}...${this.address.toString().slice(-5)}`
        : SvmTokenMetadataData.fromTokenMetadataHex(result.unwrap().accountsInfo[0].data).symbol
  }

  /**
   * Derives Metaplex Metadata address for this given token
   */
  private getMetadataAddress(): Address {
    return svm.findProgramAddress(
      [
        SvmPdaSeed.fromString('metadata'),
        SvmPdaSeed.from(Address.fromString(SvmTokenMetadataData.METADATA_PROGRAM_ID)),
        SvmPdaSeed.from(this._address),
      ],
      Address.fromBase58String(SvmTokenMetadataData.METADATA_PROGRAM_ID)
    ).address
  }

  /**
   * Checks if this token is equal to another token.
   * SPL Tokens are considered equal if they have the same address.
   * @param other - The token to compare with
   * @returns True if both tokens represent the same asset
   */
  equals(other: Token): boolean {
    return other instanceof SPLToken && super.equals(other)
  }

  /**
   * Checks if this token is the native token.
   * @returns True if the token is the native token
   */
  isNative(): boolean {
    return this.equals(SPLToken.native())
  }
}
