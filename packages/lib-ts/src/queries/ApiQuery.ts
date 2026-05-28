import { Result } from '../types'

import { QueryResponseBase } from './QueryResponse'

@json
class ApiQueryBase {
  constructor(public readonly url: string) {}
}

@json
export class ApiQuery extends ApiQueryBase {
  public readonly timestamp: i64

  constructor(url: string, timestamp: i64) {
    super(url)
    this.timestamp = timestamp
  }

  static from(url: string, timestamp: Date | null): ApiQueryBase {
    return timestamp ? new ApiQuery(url, changetype<Date>(timestamp).getTime()) : new ApiQueryBase(url)
  }
}

@json
export class ApiQueryResponse extends QueryResponseBase {
  public data: string

  constructor(success: string, data: string, error: string) {
    super(success, error)
    this.data = data
  }

  toResult(): Result<string, string> {
    return this.buildResult<string>(this.data, 'Unknown error getting api call')
  }
}
