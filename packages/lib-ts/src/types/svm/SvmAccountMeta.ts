import { stringToBool } from '../../helpers'

export class SvmAccountMeta {
  constructor(
    public pubkey: string,
    public isWritable: bool,
    public isSigner: bool
  ) {}

  static fromSerializable(serializable: SerializableSvmAccountMeta): SvmAccountMeta {
    return new SvmAccountMeta(
      serializable.pubkey,
      stringToBool(serializable.isWritable),
      stringToBool(serializable.isSigner)
    )
  }
}

@json
export class SerializableSvmAccountMeta {
  constructor(
    public pubkey: string,
    public isWritable: string,
    public isSigner: string
  ) {}
}
