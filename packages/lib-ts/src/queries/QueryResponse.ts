import { JSON } from 'json-as'

import { replaceJsonBooleans } from '../helpers'
import { Result } from '../types'

@json
export class QueryResponseBase {
  constructor(
    public success: string, // boolean as string due to json-as bug
    public error: string
  ) {}

  static fromJson<T extends QueryResponseBase>(json: string): T {
    return JSON.parse<T>(replaceJsonBooleans(json))
  }

  protected buildResult<TData, TResult = TData>(
    data: TData,
    defaultError: string,
    transform: (data: TData) => TResult = (data: TData) => changetype<TResult>(data)
  ): Result<TResult, string> {
    if (this.success !== 'true') return Result.err<TResult, string>(this.error.length > 0 ? this.error : defaultError)

    return Result.ok<TResult, string>(transform(data))
  }
}
