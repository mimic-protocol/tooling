import { ListType } from '../helpers'
import { BlockchainToken, TokenAmount, USD } from '../tokens'
import { Address, BigInt, ChainId, Result } from '../types'

import { QueryResponseBase } from './QueryResponse'

@json
export class TokenQuery {
  constructor(
    public address: string,
    public chainId: i32
  ) {}

  static fromToken(token: BlockchainToken): TokenQuery {
    return new TokenQuery(token.address.toString(), token.chainId)
  }
}

@json
export class RelevantTokensQuery {
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
  ): RelevantTokensQuery {
    const ownerStr = owner.toString()
    const usdMinAmountStr = usdMinAmount.value.toString()
    const tokensQueries = tokens.map<TokenQuery>((token) => TokenQuery.fromToken(token))
    return new RelevantTokensQuery(ownerStr, chainIds, usdMinAmountStr, tokensQueries, tokenFilter)
  }
}

@json
export class TokenBalanceQuery {
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

  /**
   * Deduplicates token balances by token address.
   * Converts TokenBalanceQuery[][] to TokenAmount[] keeping only the first occurrence of each token address.
   * @param balances - Array of arrays of TokenBalanceQuery to deduplicate
   * @returns Array of unique TokenAmount objects
   */
  static toUniqueTokenAmounts(balances: TokenBalanceQuery[][]): TokenAmount[] {
    const resultMap: Map<string, TokenAmount> = new Map()
    for (let i = 0; i < balances.length; i++) {
      for (let j = 0; j < balances[i].length; j++) {
        const tokenAmount = balances[i][j].toTokenAmount()
        const mapKey = tokenAmount.token.address.toString()

        if (resultMap.has(mapKey)) continue
        resultMap.set(mapKey, tokenAmount)
      }
    }
    return resultMap.values()
  }
}

@json
export class RelevantTokensQueryResult {
  constructor(
    public timestamp: i64,
    public balances: TokenBalanceQuery[]
  ) {}
}

@json
export class RelevantTokensQueryResponse extends QueryResponseBase {
  public data: RelevantTokensQueryResult[]

  constructor(success: string, data: RelevantTokensQueryResult[], error: string) {
    super(success, error)
    this.data = data
  }

  toBalances(): Result<TokenBalanceQuery[][], string> {
    if (this.success !== 'true') {
      return Result.err<TokenBalanceQuery[][], string>(
        this.error.length > 0 ? this.error : 'Unknown error getting relevant tokens'
      )
    }
    return Result.ok<TokenBalanceQuery[][], string>(
      this.data.map((response: RelevantTokensQueryResult) => response.balances)
    )
  }
}
