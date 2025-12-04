import { stringToBool } from '../helpers'

@json
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

  static fromSerializable<T>(serializable: QueryResponseSerializable<T>): QueryResponse<T> {
    return new QueryResponse<T>(stringToBool(serializable.success), serializable.data, serializable.error)
  }
}
