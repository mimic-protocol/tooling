import { JSON } from 'json-as'

import { replaceJsonBooleans, stringToBool } from '../helpers'

@json
@final
export class QueryResponseSerializable<T> {
  constructor(
    public success: string,
    public data: T,
    public error: string
  ) {}
}

export class QueryResponse<T> {
  constructor(
    public success: bool,
    public data: T,
    public error: string
  ) {}

  static fromJson<T>(json: string): QueryResponse<T> {
    const fixedJson = replaceJsonBooleans(json)
    return this.fromSerializable<T>(JSON.parse<QueryResponseSerializable<T>>(fixedJson))
  }

  static fromSerializable<T>(serializable: QueryResponseSerializable<T>): QueryResponse<T> {
    return new QueryResponse<T>(stringToBool(serializable.success), serializable.data, serializable.error)
  }
}
