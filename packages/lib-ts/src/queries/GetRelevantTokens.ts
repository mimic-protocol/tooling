import { ListType } from '../helpers'
import { Token, TokenAmount, USD } from '../tokens'
import { Address, BigInt, ChainId } from '../types'

@json
class TokenQuery {
  constructor(
    public address: string,
    public chainId: i32
  ) {}

  static fromToken(token: Token): TokenQuery {
    return new TokenQuery(token.address.toString(), token.chainId)
  }
}

@json
class GetRelevantTokensBase {
  constructor(
    public readonly owner: string,
    public readonly chainIds: ChainId[],
    public readonly usdMinAmount: string,
    public readonly tokens: TokenQuery[],
    public readonly tokenFilter: ListType
  ) {}
}

@json
export class GetRelevantTokens extends GetRelevantTokensBase {
  public readonly timestamp: i64

  constructor(
    owner: string,
    chainIds: ChainId[],
    usdMinAmount: string,
    tokens: TokenQuery[],
    tokenFilter: ListType,
    timestamp: i64
  ) {
    super(owner, chainIds, usdMinAmount, tokens, tokenFilter)
    this.timestamp = timestamp
  }

  static init(
    owner: Address,
    chainIds: ChainId[],
    usdMinAmount: USD,
    tokens: Token[],
    tokenFilter: ListType,
    timestamp: Date | null = null
  ): GetRelevantTokensBase {
    const ownerStr = owner.toString()
    const usdMinAmountStr = usdMinAmount.toString()
    const tokensQueries = tokens.map<TokenQuery>((token) => TokenQuery.fromToken(token))

    return timestamp
      ? new GetRelevantTokens(
          ownerStr,
          chainIds,
          usdMinAmountStr,
          tokensQueries,
          tokenFilter,
          changetype<Date>(timestamp).getTime()
        )
      : new GetRelevantTokensBase(ownerStr, chainIds, usdMinAmountStr, tokensQueries, tokenFilter)
  }
}

@json
export class GetRelevantTokensResponse {
  constructor(
    public token: TokenQuery,
    public amount: string
  ) {}

  toTokenAmount(): TokenAmount {
    return TokenAmount.fromBigInt(
      Token.fromString(this.token.address, this.token.chainId),
      BigInt.fromString(this.amount)
    )
  }
}
