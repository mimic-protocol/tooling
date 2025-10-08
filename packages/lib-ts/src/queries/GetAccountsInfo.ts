import { Address, SerializableSvmAccountInfo, SvmAccountInfo } from '../types'

@json
class GetAccountsInfoBase {
  constructor(public readonly publicKeys: string[]) {}
}

@json
export class GetAccountsInfo extends GetAccountsInfoBase {
  public readonly timestamp: i64

  constructor(publicKeys: string[], timestamp: i64) {
    super(publicKeys)
    this.timestamp = timestamp
  }

  static from(publicKeys: Address[], timestamp: Date | null): GetAccountsInfoBase {
    const strPublicKeys = publicKeys.map((pk: Address) => pk.toString())
    return timestamp
      ? new GetAccountsInfo(strPublicKeys, changetype<Date>(timestamp).getTime())
      : new GetAccountsInfoBase(strPublicKeys)
  }
}

// There is a bug with json-as, so this can't be parsed directly
export class GetAccountsInfoResponse {
  constructor(
    public accountsInfo: SvmAccountInfo[],
    public slot: string
  ) {}

  static fromSerializable(serializable: SerializableGetAccountsInfoResponse): GetAccountsInfoResponse {
    return new GetAccountsInfoResponse(
      serializable.accountsInfo.map((acc: SerializableSvmAccountInfo) => SvmAccountInfo.fromSerializable(acc)),
      serializable.slot
    )
  }
}

@json
export class SerializableGetAccountsInfoResponse {
  constructor(
    public accountsInfo: SerializableSvmAccountInfo[],
    public slot: string
  ) {}
}
