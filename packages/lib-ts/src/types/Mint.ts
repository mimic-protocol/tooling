import { BorshDeserializer } from '../helpers'

import { Address } from './Address'
import { Bytes } from './Bytes'
import { Option } from './Option'

/**
 * State layout for Mint TokenProgram PDAs
 */
export class Mint {
  static DECIMALS_OFFSET: u32 = 44

  constructor(
    public mintAuthority: Option<Address>,
    public supply: u64,
    public decimals: u8,
    public isInitialized: bool,
    public freezeAuthority: Option<Address>
  ) {}

  static fromHex(hex: string): Mint {
    return this.fromBytes(Bytes.fromHexString(hex))
  }

  static fromBytes(bytes: Bytes): Mint {
    const deserializer = BorshDeserializer.fromBytes(bytes)

    const mintAuthorityFlag = deserializer.tryU32() === 1
    const mintAuthority = deserializer.tryPubkey()
    const supply = deserializer.tryU64()
    const decimals = deserializer.tryU8()
    const isInitialized = deserializer.tryBool()
    const freezeAuthorityFlag = deserializer.tryU32() === 1
    const freezeAuthority = deserializer.tryPubkey()

    return new Mint(
      mintAuthorityFlag ? Option.some(mintAuthority) : Address.none(),
      supply,
      decimals,
      isInitialized,
      freezeAuthorityFlag ? Option.some(freezeAuthority) : Address.none()
    )
  }

  static getDecimalsFromHex(hex: string): u8 {
    return this.getDecimalsFromBytes(Bytes.fromHexString(hex))
  }

  static getDecimalsFromBytes(bytes: Bytes): u8 {
    const deserializer = BorshDeserializer.fromBytes(bytes)
    deserializer.setOffset(this.DECIMALS_OFFSET)

    return deserializer.tryU8()
  }

  toString(): string {
    return `Mint { mintAuthority: ${this.mintAuthority}, supply: ${this.supply}, decimals: ${this.decimals}, isInitialized: ${this.isInitialized}, freezeAuthority: ${this.freezeAuthority} }`
  }
}

/**
 * Partial state layout for Data Metaplex PDA (Metadata PDA "data" field)
 */
export class TokenMetadataData {
  static DATA_OFFSET: u32 = 65

  constructor(
    public name: string,
    public symbol: string,
    public uri: string
  ) {}

  static fromTokenMetadataHex(hex: string): TokenMetadataData {
    return this.fromTokenMetadataBytes(Bytes.fromHexString(hex))
  }

  static fromTokenMetadataBytes(bytes: Bytes): TokenMetadataData {
    const deserializer = BorshDeserializer.fromBytes(bytes)
    deserializer.setOffset(this.DATA_OFFSET)

    return new TokenMetadataData(deserializer.tryString(), deserializer.tryString(), deserializer.tryString())
  }

  toString(): string {
    return `TokenMetadata { name: ${this.name}, symbol: ${this.symbol}, uri: ${this.uri} }`
  }
}
