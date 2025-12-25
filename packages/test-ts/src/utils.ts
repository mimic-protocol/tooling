import {
  EthersSigner,
  OpType,
  OracleQueryName,
  OracleQueryParams,
  OracleQueryResult,
  OracleSigner,
  z,
} from '@mimicprotocol/sdk'
import { Wallet } from 'ethers'

import {
  Call,
  Intent,
  OracleResponse,
  QueryMock,
  QueryProcessor,
  Swap,
  Transfer,
  ValidationErrorContext,
} from './types'

const SIGNER = new OracleSigner(EthersSigner.fromPrivateKey(Wallet.createRandom().privateKey))

export function toIntents(intentsJson: string) {
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

export function formatValidationError(error: z.ZodError, context?: ValidationErrorContext): Error {
  const parts: string[] = []

  const validationTarget = context?.validationTarget ? ` (${context.validationTarget})` : ''

  if (context?.entryIndex !== undefined) {
    const queryType = context.queryType || 'entry'
    parts.push(`Validation error in ${queryType} #${context.entryIndex}${validationTarget}:`)
  } else if (context?.queryType) {
    parts.push(`Validation error in ${context.queryType}${validationTarget}:`)
  } else {
    parts.push(`Validation error${validationTarget}:`)
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

export function processQueries<
  TRequest,
  TResponse,
  TParams extends OracleQueryParams<OracleQueryName>,
  TValue extends OracleQueryResult<OracleQueryName>,
>(
  items: QueryMock<unknown, unknown>[],
  processor: QueryProcessor<TRequest, TResponse, TParams, TValue>,
  contextTimestamp: number
): Record<string, OracleResponse[]> {
  const oracleResponses: Record<string, OracleResponse[]> = {}
  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    const requestResult = processor.requestValidator.safeParse(item.request)
    if (!requestResult.success) {
      throw formatValidationError(requestResult.error, {
        entryIndex: i,
        queryType: processor.queryTypeLabel,
        validationTarget: 'request',
        request: item.request as Record<string, unknown>,
      })
    }

    const params = processor.transformParams(requestResult.data, contextTimestamp)

    const responseResult = processor.responseValidator.safeParse(item.response)
    if (!responseResult.success) {
      throw formatValidationError(responseResult.error, {
        entryIndex: i,
        queryType: processor.queryTypeLabel,
        validationTarget: 'response',
        request: requestResult.data as Record<string, unknown>,
      })
    }

    const value = processor.transformResponse(responseResult.data)
    addOracleResponse(oracleResponses, processor.queryName, params, value)
  }
  return oracleResponses
}

function addOracleResponse<T extends OracleQueryName>(
  oracleResponses: Record<string, OracleResponse[]>,
  queryName: T,
  params: OracleQueryParams<T>,
  value: OracleQueryResult<T>
) {
  const hash = SIGNER.getQueryHash(params, queryName)
  const response = {
    result: { value },
    query: { params, name: queryName, hash },
    signature: '',
  }
  oracleResponses[hash] = [response as OracleResponse]
}
