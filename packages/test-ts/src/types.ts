import { AnyOracleResponse } from '@mimicprotocol/sdk'
import { z } from 'zod'

import {
  InputsValidator,
  MockConfigValidator,
  MockFunctionResponseValidator,
  ParameterizedResponseValidator,
} from './validators'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export type MockResponseValue = z.infer<typeof MockFunctionResponseValidator>

export type ParameterizedResponse = z.infer<typeof ParameterizedResponseValidator>

export type MockConfig = z.output<typeof MockConfigValidator>

export type Inputs = z.infer<typeof InputsValidator>

export type Context = Partial<{
  timestamp: number
  consensusThreshold: number
  user: string
  settlers: Array<{
    address: string
    chainId: number
  }>
  configSig: string
  trigger: { type: number; data: string }
}>

export type QueryMock<T, R> = {
  request: T
  response: R
}

export type TokenPriceQueryParams = {
  token: string
  chainId: number
  timestamp?: number
}

export type TokenPriceQueryMock = QueryMock<TokenPriceQueryParams, string[]>

export type Token = {
  address: string
  chainId: number
}

export type TokenAmount = {
  token: Token
  amount: string
}

export type RelevantTokensQueryParams = {
  owner: string
  chainIds: number[]
  usdMinAmount: string
  tokens: Token[]
  tokenFilter: number
}

export type TokenBalance = {
  token: Token
  balance: string
}

export type RelevantTokensQueryResult = {
  timestamp: number
  balances: TokenBalance[]
}

export type RelevantTokensQueryMock = QueryMock<RelevantTokensQueryParams, RelevantTokensQueryResult[]>

export type EvmContractCallTypedValue = {
  abiType: string
  value: string
}

export type EvmCallQueryParams = {
  to: string
  chainId: number
  timestamp?: number
  fnSelector: string
  params?: EvmContractCallTypedValue[]
}

export type EvmCallQueryResult = EvmContractCallTypedValue

export type EvmCallQueryMock = QueryMock<EvmCallQueryParams, EvmCallQueryResult>

export type SubgraphQueryParams = {
  chainId: number
  timestamp: number
  subgraphId: string
  query: string
}

export type SubgraphQueryResult = {
  blockNumber: number
  data: string
}

export type SubgraphQueryMock = QueryMock<SubgraphQueryParams, SubgraphQueryResult>

export type GenerateMockParams = {
  context: Context
  inputs: Inputs
  prices: TokenPriceQueryMock[]
  relevantTokens: RelevantTokensQueryMock[]
  calls: EvmCallQueryMock[]
  subgraphQueries: SubgraphQueryMock[]
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
