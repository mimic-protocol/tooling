import { OracleQueryParams, OracleQueryResult, z } from '@mimicprotocol/sdk'

import { QueryProcessor, RelevantTokensRequest, RelevantTokensResponse } from '../types'
import { RelevantTokensRequestValidator, RelevantTokensResponseValidator } from '../validators'

export const relevantTokensQueryProcessor: QueryProcessor<
  RelevantTokensRequest,
  RelevantTokensResponse[],
  OracleQueryParams<'RelevantTokensQuery'>,
  OracleQueryResult<'RelevantTokensQuery'>
> = {
  queryName: 'RelevantTokensQuery',
  queryTypeLabel: 'relevant tokens entry',
  requestValidator: RelevantTokensRequestValidator,
  responseValidator: z.array(RelevantTokensResponseValidator),
  transformParams: (req) => req,
  transformResponse: (res) => res[0],
}
