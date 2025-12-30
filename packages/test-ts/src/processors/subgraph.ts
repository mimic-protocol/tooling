import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'

import { QueryProcessor, SubgraphQueryRequest, SubgraphQueryResponse } from '../types'
import { SubgraphQueryRequestValidator, SubgraphQueryResponseValidator } from '../validators'

export const subgraphQueryProcessor: QueryProcessor<
  SubgraphQueryRequest,
  SubgraphQueryResponse,
  OracleQueryParams<'SubgraphQuery'>,
  OracleQueryResult<'SubgraphQuery'>
> = {
  queryName: 'SubgraphQuery',
  queryTypeLabel: 'subgraph query entry',
  requestValidator: SubgraphQueryRequestValidator,
  responseValidator: SubgraphQueryResponseValidator,
  transformParams: (req, timestamp) => ({
    ...req,
    timestamp: req.timestamp ?? timestamp,
  }),
  transformResponse: (res) => res,
}
