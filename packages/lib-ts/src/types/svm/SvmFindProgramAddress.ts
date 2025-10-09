import { Address } from './../Address'
import { SvmPdaSeed } from './SvmPdaSeed'

@json
export class SvmFindProgramAddressParams {
  public readonly seeds: SvmPdaSeed[]
  public readonly programId: string

  constructor(seeds: SvmPdaSeed[], programId: string) {
    this.seeds = seeds.slice()
    this.programId = programId
  }
}

export class SvmFindProgramAddressResult {
  constructor(
    public address: Address,
    public bump: u8
  ) {}

  static fromSerializable(serializable: SerializableSvmFindProgramAddressResult): SvmFindProgramAddressResult {
    return new SvmFindProgramAddressResult(Address.fromString(serializable.address), serializable.bump)
  }
}

@json
export class SerializableSvmFindProgramAddressResult {
  constructor(
    public address: string,
    public bump: u8
  ) {}
}
