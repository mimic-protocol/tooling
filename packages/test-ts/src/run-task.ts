import * as fs from 'fs'
import * as path from 'path'

import RunnerMock from './RunnerMock'
import { Context, GenerateMockParams, MockConfig, Output, RunTaskOptionalParams } from './types'

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

  let _getRelevantTokens = ''
  if (balances.length > 0) {
    const tokenAmounts = balances.map((b) => `TokenAmount(Token(${b.token},${b.chainId}),BigInt(${b.balance}))`)
    _getRelevantTokens = tokenAmounts.join(',')
  }

  const priceResponse: Record<string, string> = {}
  if (prices.length > 0) {
    for (const { token, chainId, timestamp, usdPrice } of prices) {
      const key = `${token},${chainId},${timestamp || ''}`
      priceResponse[key] = usdPrice
    }
  }
  const _getPrice = { paramResponse: priceResponse, default: '0' }

  const callResponse: Record<string, string> = {}
  const decodeResponse: Record<string, string> = {}
  if (calls.length > 0) {
    for (const { to, chainId, timestamp, data, output, outputType } of calls) {
      const key = JSON.stringify({ to, chainId, timestamp: timestamp || null, data })
      callResponse[key] = output
      const decodeKey = `EvmDecodeParam(${outputType},${output})`
      decodeResponse[decodeKey] = output
    }
  }
  const _contractCall = { paramResponse: callResponse, default: '0' }
  const _decode = { paramResponse: decodeResponse, default: '0' }

  const environment = {
    _getContext: JSON.stringify({ ...context, configId: 'config-id' }),
    _getRelevantTokens,
    _getPrice,
    _contractCall,
    _transfer: { log: true, default: '' },
    _swap: { log: true, default: '' },
    _call: { log: true, default: '' },
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
