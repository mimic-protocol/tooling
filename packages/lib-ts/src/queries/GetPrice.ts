import { BlockchainToken } from '../tokens'

@json
class GetPriceBase {
  constructor(
    public readonly address: string,
    public readonly chainId: i32
  ) {}
}

@json
export class GetPrice extends GetPriceBase {
  public readonly timestamp: i64

  constructor(address: string, chainId: i32, timestamp: i64) {
    super(address, chainId)
    this.timestamp = timestamp
  }

  static fromToken(token: BlockchainToken, timestamp: Date | null): GetPriceBase {
    const address = token.address.toString()
    const chainId = token.chainId

    return timestamp
      ? new GetPrice(address, chainId, changetype<Date>(timestamp).getTime())
      : new GetPriceBase(address, chainId)
  }
}
