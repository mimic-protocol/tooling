import { Result } from '../types'

import { QueryResponseBase } from './QueryResponse'

export enum MethodType {
  GET,
  POST,
  PUT,
}

export function methodTypeToString(method: MethodType): string {
  switch (method) {
    case MethodType.GET:
      return 'GET'
    case MethodType.POST:
      return 'POST'
    case MethodType.PUT:
      return 'PUT'
    default:
      throw new Error('Invalid MethodType')
  }
}

@json
class ApiQueryBase {
  constructor(
    public readonly url: string,
    public readonly method: string,
    public readonly data: string
  ) {}
}

@json
export class ApiQuery extends ApiQueryBase {
  public readonly timestamp: i64

  constructor(url: string, method: MethodType, data: string, timestamp: i64) {
    super(url, methodTypeToString(method), data)
    this.timestamp = timestamp
  }

  static from(url: string, method: MethodType, data: string | null, timestamp: Date | null): ApiQueryBase {
    if (!data) data = '{}'
    return timestamp
      ? new ApiQuery(url, method, data, changetype<Date>(timestamp).getTime())
      : new ApiQueryBase(url, methodTypeToString(method), data)
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
