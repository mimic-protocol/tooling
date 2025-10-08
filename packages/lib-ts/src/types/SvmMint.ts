import { BorshDeserializer } from '../helpers'

import { Address } from './Address'
import { Bytes } from './Bytes'
import { Option } from './Option'

/**
 * State layout for Mint TokenProgram PDAs
 */
export class SvmMint {
  static DECIMALS_OFFSET: u32 = 44

  constructor(
    public mintAuthority: Option<Address>,
    public supply: u64,
    public decimals: u8,
    public isInitialized: bool,
    public freezeAuthority: Option<Address>
  ) {}

  static fromHex(hex: string): SvmMint {
    return this.fromBytes(Bytes.fromHexString(hex))
  }

  static fromBytes(bytes: Bytes): SvmMint {
    const deserializer = BorshDeserializer.fromBytes(bytes)

    const mintAuthorityFlag = deserializer.tryU32() === 1
    const mintAuthority = deserializer.tryPubkey()
    const supply = deserializer.tryU64()
    const decimals = deserializer.tryU8()
    const isInitialized = deserializer.tryBool()
    const freezeAuthorityFlag = deserializer.tryU32() === 1
    const freezeAuthority = deserializer.tryPubkey()

    return new SvmMint(
      mintAuthorityFlag ? Option.some(mintAuthority) : Address.none(),
      supply,
      decimals,
      isInitialized,
      freezeAuthorityFlag ? Option.some(freezeAuthority) : Address.none()
    )
  }
}
