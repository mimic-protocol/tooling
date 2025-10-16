import * as fs from 'fs'
import * as path from 'path'

import RunnerMock from './RunnerMock'
import { Context, GenerateMockParams, MockConfig, NULL_ADDRESS, Output, RunTaskOptionalParams } from './types'

export async function runTask(
  taskDir: string,
  context: Context,
  optional: RunTaskOptionalParams = {}
): Promise<Output[]> {
  const { prices = [], relevantTokens = [], calls = [], subgraphQueries = [], inputs = {} } = optional

  const taskPath = path.join(taskDir, 'build')
  const testDir = path.join(taskDir, 'tests')
  const logPath = path.join(testDir, 'test.log')
  const mockPath = path.join(testDir, 'mock.json')

  const mock = generateMock({ context, prices, relevantTokens, calls, subgraphQueries, inputs })

  fs.mkdirSync(testDir, { recursive: true })
  fs.writeFileSync(mockPath, JSON.stringify(mock, null, 2))

  if (fs.existsSync(logPath)) fs.unlinkSync(logPath)

  try {
    const runner = new RunnerMock(taskPath, testDir)
    runner.run()
    if (!fs.existsSync(logPath)) return []
    const logLines = fs.readFileSync(logPath, 'utf-8').trim().split('\n')
    return parseLogs(logLines)
  } finally {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath)
    if (fs.existsSync(mockPath)) fs.unlinkSync(mockPath)
  }
}

function generateMock(params: GenerateMockParams): MockConfig {
  const { context, prices, relevantTokens, inputs, calls, subgraphQueries } = params

  const relevantTokensResponse: Record<string, string> = {}
  if (relevantTokens.length > 0) {
    for (const relevantToken of relevantTokens) {
      const {
        request: { owner, chainIds, usdMinAmount, tokens, tokenFilter },
        response,
      } = relevantToken
      const key = JSON.stringify({
        owner: owner.toLowerCase(),
        chainIds,
        usdMinAmount,
        tokens: tokens.map((token) => ({ ...token, address: token.address.toLowerCase() })),
        tokenFilter,
      })
      relevantTokensResponse[key] = JSON.stringify(response)
    }
  }
  const _getRelevantTokens = { paramResponse: relevantTokensResponse }

  const priceResponse: Record<string, string> = {}
  if (prices.length > 0) {
    for (const {
      request: { token: address, chainId, timestamp },
      response,
    } of prices) {
      const key = JSON.stringify({
        address: address.toLowerCase(),
        chainId,
        timestamp,
      })
      priceResponse[key] = JSON.stringify(response)
    }
  }
  const _getPrice = { paramResponse: priceResponse }

  const callResponse: Record<string, string> = {}
  const decodeResponse: Record<string, string> = {}
  if (calls.length > 0) {
    for (const {
      request: { to, chainId, timestamp, data },
      response: { value, abiType },
    } of calls) {
      const key = JSON.stringify({
        to: to.toLowerCase(),
        chainId,
        timestamp,
        data: data.toLowerCase(),
      })
      callResponse[key] = value
      const decodeKey = JSON.stringify({ abiType, value })
      decodeResponse[decodeKey] = value
    }
  }
  const _contractCall = { paramResponse: callResponse }
  const _decode = { paramResponse: decodeResponse }

  const subgraphQueryResponse: Record<string, string> = {}
  if (subgraphQueries.length > 0) {
    for (const subgraphQuery of subgraphQueries) {
      const {
        request: { chainId, timestamp, subgraphId, query },
        response,
      } = subgraphQuery
      const key = JSON.stringify({ chainId, timestamp, subgraphId, query })
      subgraphQueryResponse[key] = JSON.stringify(response)
    }
  }
  const _subgraphQuery = { paramResponse: subgraphQueryResponse }

  const contextData: Required<Context> = {
    timestamp: context.timestamp || Date.now(),
    consensusThreshold: context.consensusThreshold || 1,
    user: context.user || NULL_ADDRESS,
    settlers: context.settlers || [
      {
        address: NULL_ADDRESS,
        chainId: 1,
      },
    ],
    configSig: context.configSig || 'config-sig-123',
  }

  const environment = {
    _getContext: JSON.stringify(contextData),
    _getRelevantTokens,
    _getPrice,
    _contractCall,
    _subgraphQuery,
    _call: 'log',
    _swap: 'log',
    _transfer: 'log',
  }

  const evm = { _keccak: '', _encode: { default: '' }, _decode }

  return { environment, evm, inputs }
}

function parseLogs(logLines: string[]): Output[] {
  return logLines.map((line) => {
    const [rawType, json] = line.split(/:(.+)/)
    const type = rawType.trim().replace('_', '')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { op, ...data } = JSON.parse(json.trim())
    return { type, ...data }
  })
}
