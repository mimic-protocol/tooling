import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'
import { z } from 'zod'

import { GetRelevantTokensRequest, GetRelevantTokensResponse, QueryProcessor } from '../types'
import { RelevantTokensRequestValidator, RelevantTokensResponseValidator } from '../validators'

export const relevantTokensQueryProcessor: QueryProcessor<
  GetRelevantTokensRequest,
  GetRelevantTokensResponse[],
  OracleQueryParams<'RelevantTokensQuery'>,
  OracleQueryResult<'RelevantTokensQuery'>
> = {
  queryName: 'RelevantTokensQuery',
  queryTypeLabel: 'relevant tokens entry',
  requestValidator: RelevantTokensRequestValidator,
  responseValidator: z.array(RelevantTokensResponseValidator),
  transformParams: (req) => ({
    ...req,
    usdMinAmount: req.usdMinAmount.toString(),
  }),
  transformResponse: (res) => res[0] || '',
}
