import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'
import { AbiCoder, concat } from 'ethers'

import { EvmCallQueryRequest, EvmCallQueryResponse, QueryProcessor } from '../types'
import { EvmCallRequestValidator, EvmCallTypedValueValidator } from '../validators'

export const evmCallQueryProcessor: QueryProcessor<
  EvmCallQueryRequest,
  EvmCallQueryResponse,
  OracleQueryParams<'EvmCallQuery'>,
  OracleQueryResult<'EvmCallQuery'>
> = {
  queryName: 'EvmCallQuery',
  queryTypeLabel: 'contract call entry',
  requestValidator: EvmCallRequestValidator,
  responseValidator: EvmCallTypedValueValidator,
  transformParams: (req, timestamp) => {
    const data = req.params
      ? concat([req.fnSelector, ...req.params.map((p) => AbiCoder.defaultAbiCoder().encode([p.abiType], [p.value]))])
      : req.fnSelector
    return {
      to: req.to,
      chainId: req.chainId,
      data,
      timestamp: req.timestamp ?? timestamp,
    }
  },
  transformResponse: (res) => AbiCoder.defaultAbiCoder().encode([res.abiType], [res.value]),
}
