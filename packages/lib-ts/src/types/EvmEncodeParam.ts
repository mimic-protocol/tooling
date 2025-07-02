import { JSON } from 'json-as'

import { serialize, Stringable } from '../helpers'

@json
export class EvmEncodeParam {
  constructor(
    public readonly abiType: string,
    public readonly value: string,
    public readonly values: string[]
  ) {}

  static fromValue<T extends Stringable>(type: string, value: T): EvmEncodeParam {
    return new EvmEncodeParam(type, serialize(value), [])
  }

  static fromValues(type: string, values: EvmEncodeParam[]): EvmEncodeParam {
    const serializedValues = values.map<string>((v) => JSON.stringify(v))
    return new EvmEncodeParam(type, '', serializedValues)
  }
}
