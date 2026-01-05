import { BlockchainToken, USD } from '../tokens'
import { BigInt, Result } from '../types'

import { QueryResponseBase } from './QueryResponse'

@json
class TokenPriceQueryBase {
  constructor(
    public readonly address: string,
    public readonly chainId: i32
  ) {}
}

@json
export class TokenPriceQuery extends TokenPriceQueryBase {
  public readonly timestamp: i64

  constructor(address: string, chainId: i32, timestamp: i64) {
    super(address, chainId)
    this.timestamp = timestamp
  }

  static fromToken(token: BlockchainToken, timestamp: Date | null): TokenPriceQueryBase {
    const address = token.address.toString()
    const chainId = token.chainId

    return timestamp
      ? new TokenPriceQuery(address, chainId, changetype<Date>(timestamp).getTime())
      : new TokenPriceQueryBase(address, chainId)
  }
}

@json
export class TokenPriceQueryResponse extends QueryResponseBase {
  public data: string[]

  constructor(success: string, data: string[], error: string) {
    super(success, error)
    this.data = data
  }

  toPrices(): Result<USD[], string> {
    if (this.success !== 'true') {
      return Result.err<USD[], string>(this.error.length > 0 ? this.error : 'Unknown error getting price')
    }
    const prices = this.data.map<USD>((price) => USD.fromBigInt(BigInt.fromString(price)))
    return Result.ok<USD[], string>(prices)
  }
}
