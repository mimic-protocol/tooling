import { Address, Result, SerializableSvmAccountInfo, SvmAccountInfo } from '../types'

import { QueryResponseBase } from './QueryResponse'

@json
class SvmAccountsInfoQueryBase {
  constructor(public readonly publicKeys: string[]) {}
}

@json
export class SvmAccountsInfoQuery extends SvmAccountsInfoQueryBase {
  public readonly timestamp: i64

  constructor(publicKeys: string[], timestamp: i64) {
    super(publicKeys)
    this.timestamp = timestamp
  }

  static from(publicKeys: Address[], timestamp: Date | null): SvmAccountsInfoQueryBase {
    const strPublicKeys = publicKeys.map((pk: Address) => pk.toString())
    return timestamp
      ? new SvmAccountsInfoQuery(strPublicKeys, changetype<Date>(timestamp).getTime())
      : new SvmAccountsInfoQueryBase(strPublicKeys)
  }
}

@json
export class SerializableSvmAccountsInfoQueryResult {
  constructor(
    public accountsInfo: SerializableSvmAccountInfo[],
    public slot: string
  ) {}
}

export class SvmAccountsInfoQueryResult {
  constructor(
    public accountsInfo: SvmAccountInfo[],
    public slot: string
  ) {}

  static fromSerializable(serializable: SerializableSvmAccountsInfoQueryResult): SvmAccountsInfoQueryResult {
    return new SvmAccountsInfoQueryResult(
      serializable.accountsInfo.map((acc: SerializableSvmAccountInfo) => SvmAccountInfo.fromSerializable(acc)),
      serializable.slot
    )
  }
}

@json
export class SvmAccountsInfoQueryResponse extends QueryResponseBase {
  public data: SerializableSvmAccountsInfoQueryResult

  constructor(success: string, data: SerializableSvmAccountsInfoQueryResult, error: string) {
    super(success, error)
    this.data = data
  }

  toResult(): Result<SvmAccountsInfoQueryResult, string> {
    if (this.success !== 'true') {
      return Result.err<SvmAccountsInfoQueryResult, string>(
        this.error.length > 0 ? this.error : 'Unknown error getting SVM accounts info'
      )
    }
    const result = SvmAccountsInfoQueryResult.fromSerializable(this.data)
    return Result.ok<SvmAccountsInfoQueryResult, string>(result)
  }
}
