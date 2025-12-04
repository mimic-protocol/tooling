import { JSON } from 'json-as'

import { stringToBool } from '../helpers'

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
    return this.fromSerializable<T>(
      JSON.parse<QueryResponseSerializable<T>>(json.replaceAll('true', `"true"`).replaceAll('false', `"false"`))
    )
  }

  static fromSerializable<T>(serializable: QueryResponseSerializable<T>): QueryResponse<T> {
    return new QueryResponse<T>(stringToBool(serializable.success), serializable.data, serializable.error)
  }
}
