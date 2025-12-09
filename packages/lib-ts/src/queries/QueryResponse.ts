import { JSON } from 'json-as'

import { replaceJsonBooleans } from '../helpers'

import { RelevantTokensResponse } from './RelevantTokensQuery'

@json
export class QueryResponseBase {
  constructor(
    public success: string, // boolean as string due to json-as bug
    public error: string
  ) {}

  static fromJson<T extends QueryResponseBase>(json: string): T {
    return JSON.parse<T>(replaceJsonBooleans(json))
  }
}

@json
export class TokenPriceQueryResponse extends QueryResponseBase {
  public data: string[]

  constructor(success: string, data: string[], error: string) {
    super(success, error)
    this.data = data
  }
}

@json
export class RelevantTokensQueryResponse extends QueryResponseBase {
  public data: RelevantTokensResponse[]

  constructor(success: string, data: RelevantTokensResponse[], error: string) {
    super(success, error)
    this.data = data
  }
}

@json
export class EvmCallQueryResponse extends QueryResponseBase {
  public data: string

  constructor(success: string, data: string, error: string) {
    super(success, error)
    this.data = data
  }
}
