import { runExecution } from '@mimicprotocol/runner-node'
import {
  EthersSigner,
  OpType,
  OracleQueryName,
  OracleQueryParams,
  OracleQueryResult,
  OracleSigner,
} from '@mimicprotocol/sdk'
import { AbiCoder, concat, Wallet } from 'ethers'
import * as path from 'path'
import { z, ZodError } from 'zod'

import { Call, Context, Intent, OracleResponse, RunTaskOptionalParams, RunTaskResult, Swap, Transfer } from './types'
import {
  ContextValidator,
  ContractCallRequestValidator,
  ContractCallTypedValueValidator,
  GetPriceRequestValidator,
  GetPriceResponseValidator,
  RelevantTokensRequestValidator,
  RelevantTokensResponseValidator,
  SubgraphQueryRequestValidator,
  SubgraphQueryResponseValidator,
} from './validators'

const DEFAULT_CONTEXT = {
  timestamp: Date.now(),
  consensusThreshold: 1,
  configSig: '0x',
  trigger: { type: 0, data: '0x' },
}

const signer = new OracleSigner(EthersSigner.fromPrivateKey(Wallet.createRandom().privateKey))

export async function runTask(
  taskDir: string,
  context: Context,
  optional: RunTaskOptionalParams = {},
  oracleUrl: string = ''
): Promise<RunTaskResult> {
  const taskPath = path.join(taskDir, 'task.wasm')
  const inputs = optional.inputs || {}

  const contextResult = ContextValidator.safeParse(context)
  if (!contextResult.success) {
    throw formatValidationError(contextResult.error, {
      queryType: 'context',
      request: context,
    })
  }

  const validatedContext = contextResult.data
  const oracleResponses = getOracleResponses(optional, validatedContext.timestamp || DEFAULT_CONTEXT.timestamp)
  const fullContext = { ...DEFAULT_CONTEXT, ...validatedContext, oracleResponses }

  const result = await runExecution(taskPath, JSON.stringify(inputs), JSON.stringify(fullContext), oracleUrl)
  const logs: string[] = JSON.parse(result.logsJson)

  if (!result.success && logs.length > 0) {
    console.log('The execution produced the following logs, which may indicate a problem:\n')
    for (const log of logs) {
      console.log(`- ${log}`)
    }
    console.log('\n')
  }

  return {
    success: result.success,
    timestamp: Number(result.timestamp),
    fuelUsed: Number(result.fuelUsed),
    oracleResponses: JSON.parse(result.responsesJson),
    intents: toIntents(result.intentsJson),
    logs,
  }
}

function getOracleResponses(optional: RunTaskOptionalParams, contextTimestamp: number) {
  const oracleResponses: Record<string, OracleResponse[]> = {}
  const { prices = [], relevantTokens = [], calls = [], subgraphQueries = [] } = optional

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i]

    const requestResult = GetPriceRequestValidator.safeParse(price.request)
    if (!requestResult.success) {
      throw formatValidationError(requestResult.error, {
        entryIndex: i,
        queryType: 'price entry',
        request: price.request,
      })
    }

    const { token, chainId, timestamp } = requestResult.data
    const params = {
      token: {
        address: token,
        chainId,
      },
      timestamp: timestamp || contextTimestamp,
    }

    const responseResult = GetPriceResponseValidator.safeParse(price.response)
    if (!responseResult.success) {
      throw formatValidationError(responseResult.error, {
        entryIndex: i,
        queryType: 'price entry',
        request: { token, chainId },
      })
    }

    addOracleResponse(oracleResponses, 'TokenPriceQuery', params, responseResult.data[0])
  }

  for (let i = 0; i < relevantTokens.length; i++) {
    const token = relevantTokens[i]

    const requestResult = RelevantTokensRequestValidator.safeParse(token.request)
    if (!requestResult.success) {
      throw formatValidationError(requestResult.error, {
        entryIndex: i,
        queryType: 'relevant tokens entry',
        request: token.request,
      })
    }

    const { owner, chainIds, usdMinAmount, tokens, tokenFilter } = requestResult.data
    const params = {
      owner,
      chainIds,
      usdMinAmount: usdMinAmount.toString(),
      tokens,
      tokenFilter,
    }

    const responseResult = z.array(RelevantTokensResponseValidator).safeParse(token.response)
    if (!responseResult.success) {
      throw formatValidationError(responseResult.error, {
        entryIndex: i,
        queryType: 'relevant tokens entry',
        request: { owner, chainIds, usdMinAmount, tokens, tokenFilter },
      })
    }

    addOracleResponse(oracleResponses, 'RelevantTokensQuery', params, responseResult.data[0] || '')
  }

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i]

    const requestResult = ContractCallRequestValidator.safeParse(call.request)
    if (!requestResult.success) {
      throw formatValidationError(requestResult.error, {
        entryIndex: i,
        queryType: 'contract call entry',
        request: call.request,
      })
    }

    const { to, chainId, timestamp, fnSelector, params: fnParams } = requestResult.data
    const data = fnParams
      ? concat([fnSelector, ...fnParams.map((p) => AbiCoder.defaultAbiCoder().encode([p.abiType], [p.value]))])
      : fnSelector

    const params = {
      to: to.toLowerCase(),
      chainId,
      timestamp: timestamp || contextTimestamp,
      data,
    }

    const responseResult = ContractCallTypedValueValidator.safeParse(call.response)
    if (!responseResult.success) {
      throw formatValidationError(responseResult.error, {
        entryIndex: i,
        queryType: 'contract call entry',
        request: { to, chainId, fnSelector },
      })
    }

    const value = AbiCoder.defaultAbiCoder().encode([responseResult.data.abiType], [responseResult.data.value])
    addOracleResponse(oracleResponses, 'EvmCallQuery', params, value)
  }

  for (let i = 0; i < subgraphQueries.length; i++) {
    const subgraphQuery = subgraphQueries[i]

    const requestResult = SubgraphQueryRequestValidator.safeParse(subgraphQuery.request)
    if (!requestResult.success) {
      throw formatValidationError(requestResult.error, {
        entryIndex: i,
        queryType: 'subgraph query entry',
        request: subgraphQuery.request,
      })
    }

    const { chainId, subgraphId, query, timestamp } = requestResult.data
    const params = { chainId, subgraphId, query, timestamp }

    const responseResult = SubgraphQueryResponseValidator.safeParse(subgraphQuery.response)
    if (!responseResult.success) {
      throw formatValidationError(responseResult.error, {
        entryIndex: i,
        queryType: 'subgraph query entry',
        request: { chainId, subgraphId, query, timestamp },
      })
    }

    addOracleResponse(oracleResponses, 'SubgraphQuery', params, responseResult.data)
  }

  return oracleResponses
}

function addOracleResponse<T extends OracleQueryName>(
  oracleResponses: Record<string, OracleResponse[]>,
  queryName: T,
  params: OracleQueryParams<T>,
  value: OracleQueryResult<T>
) {
  const hash = signer.getQueryHash(params, queryName)
  const response = {
    result: { value },
    query: { params, name: queryName, hash },
    signature: '',
  }
  oracleResponses[hash] = [response as OracleResponse]
}

function toIntents(intentsJson: string) {
  const raw = JSON.parse(intentsJson)
  return raw.map((intent: Partial<Intent>) => {
    if (intent.op == OpType.Swap) {
      const { sourceChain, destinationChain } = intent as Swap
      return { ...intent, sourceChain: Number(sourceChain), destinationChain: Number(destinationChain) }
    } else {
      const { chainId } = intent as Transfer | Call
      return { ...intent, chainId: Number(chainId) }
    }
  })
}

interface ValidationErrorContext {
  entryIndex?: number
  queryType?: string
  request?: Record<string, unknown>
  [key: string]: unknown
}

function formatValidationError(error: ZodError, context?: ValidationErrorContext): Error {
  const parts: string[] = []

  if (context?.entryIndex !== undefined) {
    const queryType = context.queryType || 'entry'
    parts.push(`Validation error in ${queryType} #${context.entryIndex}:`)
  } else if (context?.queryType) {
    parts.push(`Validation error in ${context.queryType}:`)
  } else {
    parts.push('Validation error:')
  }

  if (context?.request) parts.push(`  Request: ${JSON.stringify(context.request)}`)

  for (const issue of error.errors) {
    const pathStr = issue.path.length > 0 ? issue.path.join('.') : 'root'
    const pathDisplay = pathStr !== 'root' ? ` (at ${pathStr})` : ''

    let valueInfo = ''
    if (issue.code === 'invalid_type' && 'received' in issue) {
      valueInfo = `Received: ${issue.received}`
    } else if ('input' in issue && issue.input !== undefined) {
      const inputStr = typeof issue.input === 'string' ? issue.input : JSON.stringify(issue.input)
      valueInfo = `Invalid value: ${inputStr}${pathDisplay}`
    } else {
      valueInfo = `At path: ${pathStr}`
    }

    parts.push(`  ${valueInfo}`)
    parts.push(`  Error: ${issue.message}`)
  }

  return new Error(parts.join('\n'))
}
