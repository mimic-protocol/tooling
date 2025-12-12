import { ListType } from '../helpers'
import { BlockchainToken, TokenAmount, USD } from '../tokens'
import { Address, BigInt, ChainId } from '../types'

@json
class TokenQuery {
  constructor(
    public address: string,
    public chainId: i32
  ) {}

  static fromToken(token: BlockchainToken): TokenQuery {
    return new TokenQuery(token.address.toString(), token.chainId)
  }
}

@json
export class GetRelevantTokens {
  constructor(
    public readonly owner: string,
    public readonly chainIds: ChainId[],
    public readonly usdMinAmount: string,
    public readonly tokens: TokenQuery[],
    public readonly tokenFilter: ListType
  ) {}

  static init(
    owner: Address,
    chainIds: ChainId[],
    usdMinAmount: USD,
    tokens: BlockchainToken[],
    tokenFilter: ListType
  ): GetRelevantTokens {
    const ownerStr = owner.toString()
    const usdMinAmountStr = usdMinAmount.value.toString()
    const tokensQueries = tokens.map<TokenQuery>((token) => TokenQuery.fromToken(token))
    return new GetRelevantTokens(ownerStr, chainIds, usdMinAmountStr, tokensQueries, tokenFilter)
  }
}

@json
export class RelevantTokenBalance {
  constructor(
    public token: TokenQuery,
    public balance: string
  ) {}

  toTokenAmount(): TokenAmount {
    return TokenAmount.fromBigInt(
      BlockchainToken.fromString(this.token.address, this.token.chainId),
      BigInt.fromString(this.balance)
    )
  }
}

@json
export class GetRelevantTokensResponse {
  constructor(
    public timestamp: i64,
    public balances: RelevantTokenBalance[]
  ) {}
}
