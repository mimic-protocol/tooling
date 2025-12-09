import { ChainId, QueryResponseBase } from '../types'

@json
class SubgraphQueryBase {
  constructor(
    public readonly chainId: ChainId,
    public readonly subgraphId: string,
    public readonly query: string
  ) {}
}

@json
export class SubgraphQuery extends SubgraphQueryBase {
  public readonly timestamp: i64

  constructor(chainId: ChainId, timestamp: i64, subgraphId: string, query: string) {
    super(chainId, subgraphId, query)
    this.timestamp = timestamp
  }

  static from(chainId: ChainId, subgraphId: string, query: string, timestamp: Date | null): SubgraphQueryBase {
    return timestamp
      ? new SubgraphQuery(chainId, changetype<Date>(timestamp).getTime(), subgraphId, query)
      : new SubgraphQueryBase(chainId, subgraphId, query)
  }
}

@json
export class SubgraphQueryResult {
  constructor(
    public blockNumber: i64,
    public data: string
  ) {}
}

@json
export class SubgraphQueryResponse extends QueryResponseBase {
  public data: SubgraphQueryResult

  constructor(success: string, data: SubgraphQueryResult, error: string) {
    super(success, error)
    this.data = data
  }
}
