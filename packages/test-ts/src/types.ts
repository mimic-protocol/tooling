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
  ContractCallRequestValidator,
  ContractCallTypedValueValidator,
  GetPriceRequestValidator,
  GetPriceResponseValidator,
  InputsValidator,
  MockConfigValidator,
  MockFunctionResponseValidator,
  ParameterizedResponseValidator,
  RelevantTokenBalanceValidator,
  RelevantTokensRequestValidator,
  RelevantTokensResponseValidator,
  SubgraphQueryRequestValidator,
  SubgraphQueryResponseValidator,
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

export type GetPriceRequest = z.infer<typeof GetPriceRequestValidator>
export type GetPriceResponse = z.infer<typeof GetPriceResponseValidator>

export type GetPriceMock = QueryMock<GetPriceRequest, GetPriceResponse>

export type Token = z.infer<typeof TokenValidator>

export type TokenAmount = z.infer<typeof TokenAmountValidator>

export type GetRelevantTokensRequest = z.infer<typeof RelevantTokensRequestValidator>

export type RelevantTokenBalance = z.infer<typeof RelevantTokenBalanceValidator>

export type GetRelevantTokensResponse = z.infer<typeof RelevantTokensResponseValidator>

export type GetRelevantTokensMock = QueryMock<GetRelevantTokensRequest, GetRelevantTokensResponse[]>

export type ContractCallTypedValue = z.infer<typeof ContractCallTypedValueValidator>

export type ContractCallRequest = z.infer<typeof ContractCallRequestValidator>

export type ContractCallResponse = ContractCallTypedValue

export type ContractCallMock = QueryMock<ContractCallRequest, ContractCallResponse>

export type SubgraphQueryRequest = z.infer<typeof SubgraphQueryRequestValidator>
export type SubgraphQueryResponse = z.infer<typeof SubgraphQueryResponseValidator>

export type SubgraphQueryMock = QueryMock<SubgraphQueryRequest, SubgraphQueryResponse>

export type GenerateMockParams = {
  context: Context
  inputs: Inputs
  prices: GetPriceMock[]
  relevantTokens: GetRelevantTokensMock[]
  calls: ContractCallMock[]
  subgraphQueries: SubgraphQueryMock[]
  showLogs: boolean // parameter to control logging of failed task executions
}

export type RunTaskOptionalParams = Partial<Omit<GenerateMockParams, 'context'>>

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

export type RunTaskResult = {
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
