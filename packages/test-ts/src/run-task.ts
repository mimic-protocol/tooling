import * as fs from 'fs'
import * as path from 'path'

import RunnerMock from './RunnerMock'
import { Context, GenerateMockParams, MockConfig, NULL_ADDRESS, Output, RunTaskOptionalParams } from './types'

export async function runTask(
  taskDir: string,
  context: Context,
  optional: RunTaskOptionalParams = {}
): Promise<Output[]> {
  const { prices = [], balances = [], calls = [], inputs = {} } = optional

  const taskPath = path.join(taskDir, 'build')
  const testDir = path.join(taskDir, 'tests')
  const logPath = path.join(testDir, 'test.log')
  const mockPath = path.join(testDir, 'mock.json')

  const mock = generateMock({ context, prices, balances, calls, inputs })

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
  const { context, prices, balances, inputs, calls } = params

  const relevantTokensResponse: Record<string, string> = {}
  if (balances.length > 0) {
    for (const balance of balances) {
      const { owner, chainIds, usdMinAmount, tokens, tokenFilter, timestamp, output } = balance
      const key = JSON.stringify({
        owner: normalizeValue(owner),
        chainIds,
        usdMinAmount,
        tokens: normalizeValue(tokens),
        tokenFilter,
        timestamp,
      })
      relevantTokensResponse[key] = JSON.stringify(normalizeValue(output))
    }
  }
  const _getRelevantTokens = { paramResponse: relevantTokensResponse }

  const priceResponse: Record<string, string> = {}
  if (prices.length > 0) {
    for (const { token: address, chainId, timestamp, usdPrice } of prices) {
      const key = JSON.stringify({
        address: normalizeValue(address),
        chainId,
        timestamp,
      })
      priceResponse[key] = usdPrice
    }
  }
  const _getPrice = { paramResponse: priceResponse }

  const callResponse: Record<string, string> = {}
  const decodeResponse: Record<string, string> = {}
  if (calls.length > 0) {
    for (const { to, chainId, timestamp, data, output, outputType } of calls) {
      const key = JSON.stringify({
        to: normalizeValue(to),
        chainId,
        ...(timestamp !== undefined && { timestamp }),
        data: normalizeValue(data),
      })
      callResponse[key] = normalizeValue(output)
      const decodeKey = JSON.stringify({ abiType: outputType, value: normalizeValue(output) })
      decodeResponse[decodeKey] = normalizeValue(output)
    }
  }
  const _contractCall = { paramResponse: callResponse }
  const _decode = { paramResponse: decodeResponse }

  const contextData: Required<Context> = {
    timestamp: context.timestamp || Date.now(),
    consensusThreshold: context.consensusThreshold || 1,
    user: normalizeValue(context.user || NULL_ADDRESS),
    settlers: context.settlers || [
      {
        address: normalizeValue(NULL_ADDRESS),
        chainId: 1,
      },
    ],
    configSig: normalizeValue(context.configSig || 'config-sig-123'),
  }

  const environment = {
    _getContext: JSON.stringify(contextData),
    _getRelevantTokens,
    _getPrice,
    _contractCall,
    _call: 'log',
    _swap: 'log',
    _transfer: 'log',
  }

  const evm = { _keccak: '', _encode: { default: '' }, _decode }

  return { environment, evm, inputs: normalizeValue(inputs) }
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

function normalizeValue<T>(value: T): T {
  if (typeof value === 'string') return value.toLowerCase() as T
  if (Array.isArray(value)) return value.map(normalizeValue) as T
  if (typeof value === 'object' && value !== null)
    return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, normalizeValue(value)])) as T

  return value
}
