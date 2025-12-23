import { runExecution } from '@mimicprotocol/runner-node'
import {
  EthersSigner,
  OpType,
  OracleQueryName,
  OracleQueryParams,
  OracleQueryResult,
  OracleRelevantTokenFilter,
  OracleSigner,
} from '@mimicprotocol/sdk'
import { AbiCoder, concat, Wallet } from 'ethers'
import * as path from 'path'

import { Call, Context, Intent, OracleResponse, RunTaskOptionalParams, RunTaskResult, Swap, Transfer } from './types'

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

  const oracleResponses = getOracleResponses(optional, context.timestamp || DEFAULT_CONTEXT.timestamp)
  const fullContext = { ...DEFAULT_CONTEXT, ...context, oracleResponses }

  const result = await runExecution(taskPath, JSON.stringify(inputs), JSON.stringify(fullContext), oracleUrl)
  return {
    success: result.success,
    timestamp: Number(result.timestamp),
    fuelUsed: Number(result.fuelUsed),
    oracleResponses: JSON.parse(result.responsesJson),
    intents: toIntents(result.intentsJson),
    logs: JSON.parse(result.logsJson),
  }
}

function getOracleResponses(optional: RunTaskOptionalParams, contextTimestamp: number) {
  const oracleResponses: Record<string, OracleResponse[]> = {}
  const { prices = [], relevantTokens = [], calls = [], subgraphQueries = [] } = optional

  for (const price of prices) {
    const { token, chainId, timestamp } = price.request
    const params = {
      token: {
        address: token.toLowerCase(),
        chainId,
      },
      timestamp: timestamp || contextTimestamp,
    }
    addOracleResponse(oracleResponses, 'TokenPriceQuery', params, price.response[0] || '')
  }

  for (const token of relevantTokens) {
    const { owner, chainIds, usdMinAmount, tokens, tokenFilter } = token.request
    const params = {
      owner: owner.toLowerCase(),
      chainIds,
      usdMinAmount,
      tokens: tokens.map((t) => ({
        address: t.address.toLowerCase(),
        chainId: t.chainId,
      })),
      tokenFilter: tokenFilter as OracleRelevantTokenFilter,
    }
    addOracleResponse(oracleResponses, 'RelevantTokensQuery', params, token.response[0] || '')
  }

  for (const call of calls) {
    const { to, chainId, timestamp, fnSelector, params: fnParams } = call.request
    const data = fnParams
      ? concat([fnSelector, ...fnParams.map((p) => AbiCoder.defaultAbiCoder().encode([p.abiType], [p.value]))])
      : fnSelector

    const params = {
      to: to.toLowerCase(),
      chainId,
      timestamp: timestamp || contextTimestamp,
      data,
    }
    const value = AbiCoder.defaultAbiCoder().encode([call.response.abiType], [call.response.value])
    addOracleResponse(oracleResponses, 'EvmCallQuery', params, value)
  }

  for (const subgraphQuery of subgraphQueries) {
    const { chainId, subgraphId, query, timestamp } = subgraphQuery.request
    const params = { chainId, subgraphId, query, timestamp }
    addOracleResponse(oracleResponses, 'SubgraphQuery', params, subgraphQuery.response)
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
    }

    const { chainId } = intent as Transfer | Call
    return { ...intent, chainId: Number(chainId) }
  })
}
