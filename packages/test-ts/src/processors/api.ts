import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'

import { ApiQueryRequest, ApiQueryResponse, QueryProcessor } from '../types'
import { ApiQueryRequestValidator, ApiQueryResponseValidator } from '../validators'

export const apiQueryProcessor: QueryProcessor<
  ApiQueryRequest,
  ApiQueryResponse,
  OracleQueryParams<'ApiQuery'>,
  OracleQueryResult<'ApiQuery'>
> = {
  queryName: 'ApiQuery',
  queryTypeLabel: 'api query entry',
  requestValidator: ApiQueryRequestValidator,
  responseValidator: ApiQueryResponseValidator,
  transformParams: (req, timestamp) => ({
    ...req,
    timestamp: req.timestamp ?? timestamp,
  }),
  transformResponse: (res) => res,
}
