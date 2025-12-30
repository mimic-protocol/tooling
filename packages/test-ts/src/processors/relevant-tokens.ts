import { OracleQueryParams, OracleQueryResult, z } from '@mimicprotocol/sdk'

import { QueryProcessor, RelevantTokensQueryRequest, RelevantTokensQueryResponse } from '../types'
import { RelevantTokensRequestValidator, RelevantTokensResponseValidator } from '../validators'

export const relevantTokensQueryProcessor: QueryProcessor<
  RelevantTokensQueryRequest,
  RelevantTokensQueryResponse[],
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
