@json
export class EvmDecodeParam {
  constructor(
    public readonly abiType: string,
    public readonly value: string
  ) {}
}
