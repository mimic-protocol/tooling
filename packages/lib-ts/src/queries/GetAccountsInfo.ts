import { Address } from '../types'

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
    const strPublicKeys = publicKeys.map((pk) => pk.toString())
    return timestamp
      ? new GetAccountsInfo(strPublicKeys, changetype<Date>(timestamp).getTime())
      : new GetAccountsInfoBase(strPublicKeys)
  }
}
