import { OracleQueryParams, OracleQueryResult } from '@mimicprotocol/sdk'

import { QueryProcessor, TokenPriceRequest, TokenPriceResponse } from '../types'
import { TokenPriceRequestValidator, TokenPriceResponseValidator } from '../validators'

export const priceQueryProcessor: QueryProcessor<
  TokenPriceRequest,
  TokenPriceResponse,
  OracleQueryParams<'TokenPriceQuery'>,
  OracleQueryResult<'TokenPriceQuery'>
> = {
  queryName: 'TokenPriceQuery',
  queryTypeLabel: 'price entry',
  requestValidator: TokenPriceRequestValidator,
  responseValidator: TokenPriceResponseValidator,
  transformParams: (req, timestamp) => ({
    token: req.token,
    timestamp: req.timestamp ?? timestamp,
  }),
  transformResponse: (res) => res[0],
}
