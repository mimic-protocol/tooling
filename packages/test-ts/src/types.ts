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
}>

export type TokenPrice = {
  token: string
  chainId: number
  usdPrice: string
  timestamp?: string
}

export type Token = {
  address: string
  chainId: number
}

export type TokenAmount = {
  token: Token
  amount: string
}

export type RelevantTokens = {
  owner: string
  chainIds: number[]
  usdMinAmount: string
  tokens: { address: string; chainId: number }[]
  tokenFilter: number
  output: TokenAmount[]
}

export type ContractCall = {
  to: string
  chainId: number
  timestamp?: string
  data: string
  output: string
  outputType: string
}

export type GenerateMockParams = {
  context: Context
  inputs: Inputs
  prices: TokenPrice[]
  balances: RelevantTokens[]
  calls: ContractCall[]
}

export type RunTaskOptionalParams = Partial<Omit<GenerateMockParams, 'context'>>

export type Intent = {
  op: number
  settler: string
  user: string
  deadline: string
  nonce: string
  maxFees: { token: string; amount: string }[]
}

export type Transfer = Intent & {
  type: 'transfer'
  chainId: number
  transfers: { token: string; amount: string; recipient: string }[]
}

export type Swap = Intent & {
  type: 'swap'
  sourceChain: number
  destinationChain: number
  tokensIn: { token: string; amount: string }[]
  tokensOut: { token: string; minAmount: string; recipient: string }[]
}

export type Call = Intent & {
  type: 'call'
  chainId: number
  calls: { target: string; data: string; value: string }[]
}

export type Output = Transfer | Swap | Call
