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

  protected getErrorMessage(defaultError: string): string {
    return this.error.length > 0 ? this.error : defaultError
  }

  protected getError<T>(defaultError: string): Result<T, string> | null {
    if (this.success !== 'true') return Result.err<T, string>(this.getErrorMessage(defaultError))

    return null
  }

  protected buildResult<T>(data: T, defaultError: string): Result<T, string> {
    const errorResult = this.getError<T>(defaultError)
    if (errorResult) return errorResult
    return Result.ok<T, string>(data)
  }
}
