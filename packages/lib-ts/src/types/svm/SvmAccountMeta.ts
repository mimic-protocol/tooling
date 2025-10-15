import { Address } from '../Address'

@json
export class SvmAccountMeta {
  constructor(
    public pubkey: string,
    public isWritable: bool = false,
    public isSigner: bool = false
  ) {}

  writable(): SvmAccountMeta {
    this.isWritable = true
    return this
  }

  signer(): SvmAccountMeta {
    this.isSigner = true
    return this
  }

  static fromAddress(pubkey: Address): SvmAccountMeta {
    return new SvmAccountMeta(pubkey.toString())
  }

  static fromString(pubkey: string): SvmAccountMeta {
    return new SvmAccountMeta(pubkey)
  }
}
