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
    const tokenAmounts = balances.map((b) => ({
      token: { address: b.token, chainId: b.chainId },
      amount: b.balance,
    }))
    relevantTokensResponse['default'] = JSON.stringify(tokenAmounts)
  }
  const _getRelevantTokens = { paramResponse: relevantTokensResponse, default: '[]' }

  const priceResponse: Record<string, string> = {}
  if (prices.length > 0) {
    for (const { token, chainId, timestamp, usdPrice } of prices) {
      const key = `${token},${chainId},${timestamp || ''}`
      priceResponse[key] = usdPrice
    }
  }
  const _getPrice = { paramResponse: priceResponse, default: (1 * 10 ** 18).toString() }

  const callResponse: Record<string, string> = {}
  const decodeResponse: Record<string, string> = {}
  if (calls.length > 0) {
    for (const { to, chainId, timestamp, data, output, outputType } of calls) {
      const key = JSON.stringify({ to, chainId, timestamp: timestamp || null, data })
      callResponse[key] = output
      const decodeKey = JSON.stringify({ abiType: outputType, value: output })
      decodeResponse[decodeKey] = output
    }
  }
  const _contractCall = { paramResponse: callResponse, default: '0x00' }
  const _decode = { paramResponse: decodeResponse, default: '0' }

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
