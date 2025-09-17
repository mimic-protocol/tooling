import { AccountInfo, Address } from '../types'

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
@json
export class GetAccountsInfoResponse {
  constructor(
    public accountsInfo: AccountInfo[],
    public slot: string
  ) {}
}

@json
export class GetAccountsInfoStringResponse {
  constructor(
    public accountsInfo: AccountInfoString[],
    public slot: string
  ) {}

  toGetAccountsInfoResponse(): GetAccountsInfoResponse {
    return new GetAccountsInfoResponse(
      this.accountsInfo.map((acc: AccountInfoString) => acc.toAccountInfo()),
      this.slot
    )
  }
}

@json
class AccountInfoString {
  constructor(
    public owner: string,
    public lamports: string,
    public data: string,
    public rentEpoch: string,
    public executable: string
  ) {}

  toAccountInfo(): AccountInfo {
    return new AccountInfo(this.owner, this.lamports, this.data, this.rentEpoch, this.parseBoolean(this.executable))
  }

  parseBoolean(boolean: string): boolean {
    if (boolean !== 'true' && boolean !== 'false') throw new Error(`Invalid boolean: ${boolean}`)
    return boolean === 'true'
  }
}
