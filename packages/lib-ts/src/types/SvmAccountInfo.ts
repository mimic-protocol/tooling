import { stringToBool } from '../helpers'

export class SvmAccountInfo {
  constructor(
    public owner: string,
    public lamports: string,
    public data: string,
    public rentEpoch: string,
    public executable: bool
  ) {}

  static fromSerializable(serializable: SerializableSvmAccountInfo): SvmAccountInfo {
    return new SvmAccountInfo(
      serializable.owner,
      serializable.lamports,
      serializable.data,
      serializable.rentEpoch,
      stringToBool(serializable.executable)
    )
  }
}

@json
export class SerializableSvmAccountInfo {
  constructor(
    public owner: string,
    public lamports: string,
    public data: string,
    public rentEpoch: string,
    public executable: string
  ) {}
}
