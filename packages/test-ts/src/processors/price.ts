import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'

import { GetPriceRequest, GetPriceResponse, QueryProcessor } from '../types'
import { GetPriceRequestValidator, GetPriceResponseValidator } from '../validators'

export const priceQueryProcessor: QueryProcessor<
  GetPriceRequest,
  GetPriceResponse,
  OracleQueryParams<'TokenPriceQuery'>,
  OracleQueryResult<'TokenPriceQuery'>
> = {
  queryName: 'TokenPriceQuery',
  queryTypeLabel: 'price entry',
  requestValidator: GetPriceRequestValidator,
  responseValidator: GetPriceResponseValidator,
  transformParams: (req, timestamp) => ({
    token: req.token,
    timestamp: req.timestamp ?? timestamp,
  }),
  transformResponse: (res) => res[0],
}
