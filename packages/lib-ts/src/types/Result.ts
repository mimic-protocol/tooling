// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

/**
 * The result of an operation, with a corresponding value and error type.
 */
export class Result<V, E> {
  constructor(
    private _value: Wrapped<V> | null,
    private _error: Wrapped<E> | null
  ) {}

  static ok<V, E>(value: V): Result<V, E> {
    return new Result<V, E>(new Wrapped<V>(value), null)
  }

  static err<V, E>(error: E): Result<V, E> {
    return new Result<V, E>(null, new Wrapped<E>(error))
  }

  get isOk(): boolean {
    return this._value !== null
  }

  get isError(): boolean {
    return this._error !== null
  }

  get value(): V {
    if (this.isError) throw new Error('Trying to get a value from an error result')
    return changetype<Wrapped<V>>(this._value).inner
  }

  get error(): E {
    if (this.isOk) throw new Error('Trying to get an error from a successful result')
    return changetype<Wrapped<E>>(this._error).inner
  }
}

// This is used to wrap a generic so that it can be unioned with `null`, working around limitations
// with primitives.
export class Wrapped<T> {
  inner: T

  constructor(inner: T) {
    this.inner = inner
  }
}
