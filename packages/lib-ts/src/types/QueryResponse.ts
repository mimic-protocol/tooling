import { JSON } from 'json-as'

import { replaceJsonBooleans } from '../helpers'
import { RelevantTokensQueryResult, SubgraphQueryResult } from '../queries'

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
export class PriceQueryResponse extends QueryResponseBase {
  public data: string[]

  constructor(success: string, data: string[], error: string) {
    super(success, error)
    this.data = data
  }
}

@json
export class RelevantTokensQueryResponse extends QueryResponseBase {
  public data: RelevantTokensQueryResult[]

  constructor(success: string, data: RelevantTokensQueryResult[], error: string) {
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

@json
export class SubgraphQueryResponse extends QueryResponseBase {
  public data: SubgraphQueryResult

  constructor(success: string, data: SubgraphQueryResult, error: string) {
    super(success, error)
    this.data = data
  }
}
