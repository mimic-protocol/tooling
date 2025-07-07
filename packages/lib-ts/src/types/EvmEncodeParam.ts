import { serialize, Stringable } from '../helpers'

@json
export abstract class EvmEncodeParamBase {
  constructor(public readonly abiType: string) {}
}

@json
export class EvmEncodeParam extends EvmEncodeParamBase {
  constructor(
    abiType: string,
    public readonly value: string
  ) {
    super(abiType)
  }

  static fromValue<T extends Stringable>(type: string, value: T): EvmEncodeParamBase {
    return new EvmEncodeParam(type, serialize(value))
  }

  static fromValues(type: string, values: EvmEncodeParamBase[]): EvmEncodeParamBase {
    return new EvmEncodeParamArray(type, values)
  }
}

@json
class EvmEncodeParamArray extends EvmEncodeParamBase {
  constructor(
    abiType: string,
    public readonly value: EvmEncodeParamBase[]
  ) {
    super(abiType)
  }
}
