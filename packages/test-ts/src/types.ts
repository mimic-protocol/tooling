import {
  AnyOracleResponse,
  OracleQueryName,
  OracleQueryParams,
  OracleQueryResult,
  TokenAmountValidator,
  TokenValidator,
  z,
} from '@mimicprotocol/sdk'

import {
  ContextValidator,
  EvmCallRequestValidator,
  EvmCallTypedValueValidator,
  InputsValidator,
  MockConfigValidator,
  MockFunctionResponseValidator,
  ParameterizedResponseValidator,
  RelevantTokenBalanceValidator,
  RelevantTokensRequestValidator as RelevantTokensQueryRequestValidator,
  RelevantTokensResponseValidator as RelevantTokensQueryResponseValidator,
  SubgraphQueryRequestValidator,
  SubgraphQueryResponseValidator,
  TokenPriceRequestValidator as TokenPriceQueryRequestValidator,
  TokenPriceResponseValidator as TokenPriceQueryResponseValidator,
} from './validators'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export type MockResponseValue = z.infer<typeof MockFunctionResponseValidator>

export type ParameterizedResponse = z.infer<typeof ParameterizedResponseValidator>

export type MockConfig = z.output<typeof MockConfigValidator>

export type Inputs = z.infer<typeof InputsValidator>

export type Context = z.infer<typeof ContextValidator>

export type QueryMock<T, R> = {
  request: T
  response: R
}

export type QueryProcessor<
  TRequest,
  TResponse,
  TParams extends OracleQueryParams<OracleQueryName>,
  TValue extends OracleQueryResult<OracleQueryName>,
> = {
  queryName: OracleQueryName
  queryTypeLabel: string
  requestValidator: z.ZodType<TRequest>
  responseValidator: z.ZodType<TResponse>
  transformParams: (request: TRequest, contextTimestamp: number) => TParams
  transformResponse: (response: TResponse) => TValue
}

export type TokenPriceQueryRequest = z.infer<typeof TokenPriceQueryRequestValidator>
export type TokenPriceQueryResponse = z.infer<typeof TokenPriceQueryResponseValidator>

export type TokenPriceQueryMock = QueryMock<TokenPriceQueryRequest, TokenPriceQueryResponse>

export type Token = z.infer<typeof TokenValidator>

export type TokenAmount = z.infer<typeof TokenAmountValidator>

export type RelevantTokensQueryRequest = z.infer<typeof RelevantTokensQueryRequestValidator>

export type RelevantTokenBalance = z.infer<typeof RelevantTokenBalanceValidator>

export type RelevantTokensQueryResponse = z.infer<typeof RelevantTokensQueryResponseValidator>

export type RelevantTokensQueryMock = QueryMock<RelevantTokensQueryRequest, RelevantTokensQueryResponse[]>

export type EvmCallTypedValue = z.infer<typeof EvmCallTypedValueValidator>

export type EvmCallQueryRequest = z.infer<typeof EvmCallRequestValidator>

export type EvmCallQueryResponse = EvmCallTypedValue

export type EvmCallQueryMock = QueryMock<EvmCallQueryRequest, EvmCallQueryResponse>

export type SubgraphQueryRequest = z.infer<typeof SubgraphQueryRequestValidator>
export type SubgraphQueryResponse = z.infer<typeof SubgraphQueryResponseValidator>

export type SubgraphQueryMock = QueryMock<SubgraphQueryRequest, SubgraphQueryResponse>

export type GenerateMockParams = {
  context: Context
  inputs: Inputs
  prices: TokenPriceQueryMock[]
  relevantTokens: RelevantTokensQueryMock[]
  calls: EvmCallQueryMock[]
  subgraphQueries: SubgraphQueryMock[]
  showLogs: boolean
}

export type RunFunctionOptionalParams = Partial<Omit<GenerateMockParams, 'context'>>

export type IntentBase = {
  op: number
  settler: string
  user: string
  deadline: string
  nonce: string
  maxFees: { token: string; amount: string }[]
  events: { topic: string; data: string }[]
}

export type Transfer = IntentBase & {
  chainId: number
  transfers: { token: string; amount: string; recipient: string }[]
}

export type Swap = IntentBase & {
  sourceChain: number
  destinationChain: number
  tokensIn: { token: string; amount: string }[]
  tokensOut: { token: string; minAmount: string; recipient: string }[]
}

export type Call = IntentBase & {
  chainId: number
  calls: { target: string; data: string; value: string }[]
}

export type Intent = Transfer | Swap | Call

export type OracleResponse = AnyOracleResponse

export type RunFunctionResult = {
  success: boolean
  timestamp: number
  fuelUsed: number
  oracleResponses: OracleResponse[]
  intents: Intent[]
  logs: string[]
}

export type ValidationErrorContext = {
  entryIndex?: number
  queryType?: string
  validationTarget?: 'request' | 'response'
  request?: Record<string, unknown>
  [key: string]: unknown
}
