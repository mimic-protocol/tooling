import { Address, ChainId } from '../types'

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
