import { BlockchainToken } from '../tokens'

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
