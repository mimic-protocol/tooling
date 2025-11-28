import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'
import { AbiCoder, concat } from 'ethers'

import { ContractCallRequest, ContractCallResponse, QueryProcessor } from '../types'
import { ContractCallRequestValidator, ContractCallTypedValueValidator } from '../validators'

export const contractCallQueryProcessor: QueryProcessor<
  ContractCallRequest,
  ContractCallResponse,
  OracleQueryParams<'EvmCallQuery'>,
  OracleQueryResult<'EvmCallQuery'>
> = {
  queryName: 'EvmCallQuery',
  queryTypeLabel: 'contract call entry',
  requestValidator: ContractCallRequestValidator,
  responseValidator: ContractCallTypedValueValidator,
  transformParams: (req, timestamp) => {
    const data = req.params
      ? concat([req.fnSelector, ...req.params.map((p) => AbiCoder.defaultAbiCoder().encode([p.abiType], [p.value]))])
      : req.fnSelector
    return {
      to: req.to,
      chainId: req.chainId,
      data,
      timestamp: req.timestamp || timestamp,
    }
  },
  transformResponse: (res) => AbiCoder.defaultAbiCoder().encode([res.abiType], [res.value]),
}
