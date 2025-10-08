import { BorshDeserializer } from '../helpers'

import { Bytes } from './Bytes'

/**
 * Partial state layout for Data Metaplex PDA (Metadata PDA "data" field)
 */
export class SvmTokenMetadataData {
  static DATA_OFFSET: u32 = 65
  // eslint-disable-next-line no-secrets/no-secrets
  static METADATA_PROGRAM_ID: string = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'

  constructor(
    public name: string,
    public symbol: string,
    public uri: string
  ) {}

  static fromTokenMetadataHex(hex: string): SvmTokenMetadataData {
    return this.fromTokenMetadataBytes(Bytes.fromHexString(hex))
  }

  static fromTokenMetadataBytes(bytes: Bytes): SvmTokenMetadataData {
    const deserializer = BorshDeserializer.fromBytes(bytes)
    deserializer.setOffset(this.DATA_OFFSET)

    return new SvmTokenMetadataData(deserializer.tryString(), deserializer.tryString(), deserializer.tryString())
  }
}
