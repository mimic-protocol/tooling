import { ListType } from '../helpers'
import { Token, USD } from '../tokens'
import { Address, ChainId } from '../types'

@json
class TokenQuery {
  constructor(
    public readonly address: string,
    public readonly chainId: ChainId
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
