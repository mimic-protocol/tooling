import { runExecution } from '@mimicprotocol/runner-node'
import * as path from 'path'

import {
  evmCallQueryProcessor,
  priceQueryProcessor,
  relevantTokensQueryProcessor,
  subgraphQueryProcessor,
} from './processors'
import { Context, RunFunctionOptionalParams, RunFunctionResult } from './types'
import { formatValidationError, processQueries, toIntents } from './utils'
import { ContextValidator } from './validators'

const DEFAULT_CONTEXT = {
  timestamp: Date.now(),
  consensusThreshold: 1,
  triggerSig: '0x',
  triggerPayload: { type: 0, data: '0x' },
}

export async function runFunction(
  functionDir: string,
  context: Context,
  optional: RunFunctionOptionalParams = {},
  oracleUrl: string = ''
): Promise<RunFunctionResult> {
  const functionPath = path.join(functionDir, 'function.wasm')
  const inputs = optional.inputs || {}
  const showLogs = optional.showLogs ?? true

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

  const result = await runExecution(functionPath, JSON.stringify(inputs), JSON.stringify(fullContext), oracleUrl)
  const logs: string[] = JSON.parse(result.logsJson)

  if (showLogs && !result.success && logs.length > 0) {
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

function getOracleResponses(optional: RunFunctionOptionalParams, contextTimestamp: number) {
  const { prices = [], relevantTokens = [], calls = [], subgraphQueries = [] } = optional

  const priceResponses = processQueries(prices, priceQueryProcessor, contextTimestamp)
  const relevantTokensResponses = processQueries(relevantTokens, relevantTokensQueryProcessor, contextTimestamp)
  const callsResponses = processQueries(calls, evmCallQueryProcessor, contextTimestamp)
  const subgraphQueriesResponses = processQueries(subgraphQueries, subgraphQueryProcessor, contextTimestamp)

  return {
    ...priceResponses,
    ...relevantTokensResponses,
    ...callsResponses,
    ...subgraphQueriesResponses,
  }
}
