import { Address, ChainId, Result } from '../types'

import { QueryResponseBase } from './QueryResponse'

@json
class EvmCallQueryBase {
  constructor(
    public readonly to: string,
    public readonly chainId: ChainId,
    public readonly data: string
  ) {}
}

@json
export class EvmCallQuery extends EvmCallQueryBase {
  public readonly timestamp: i64

  constructor(to: string, chainId: ChainId, timestamp: i64, data: string) {
    super(to, chainId, data)
    this.timestamp = timestamp
  }

  static from(to: Address, chainId: ChainId, timestamp: Date | null, data: string): EvmCallQueryBase {
    const address = to.toString()
    return timestamp
      ? new EvmCallQuery(address, chainId, changetype<Date>(timestamp).getTime(), data)
      : new EvmCallQueryBase(address, chainId, data)
  }
}

@json
export class EvmCallQueryResponse extends QueryResponseBase {
  public data: string

  constructor(success: string, data: string, error: string) {
    super(success, error)
    this.data = data
  }

  toResult(): Result<string, string> {
    const errorResult = this.checkSuccess<string>('Unknown error getting evm call')
    if (errorResult !== null) return errorResult
    return Result.ok<string, string>(this.data)
  }
}
