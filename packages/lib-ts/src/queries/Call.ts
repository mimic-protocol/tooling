import { Address, ChainId } from '../types'

@json
class CallBase {
  constructor(
    public readonly to: string,
    public readonly chainId: ChainId,
    public readonly data: string
  ) {}
}

@json
export class Call extends CallBase {
  public readonly timestamp: i64

  constructor(to: string, chainId: ChainId, timestamp: i64, data: string) {
    super(to, chainId, data)
    this.timestamp = timestamp
  }

  static from(to: Address, chainId: ChainId, timestamp: Date | null, data: string): CallBase {
    const address = to.toString()
    return timestamp
      ? new Call(address, chainId, changetype<Date>(timestamp).getTime(), data)
      : new CallBase(address, chainId, data)
  }
}
