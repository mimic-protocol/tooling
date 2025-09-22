import { JSON } from 'json-as'

import { Byteable, bytesToHexString } from '../helpers'

import { Address } from './Address'

@json
export class Seed {
  constructor(public readonly hex: string) {}

  static fromString(str: string): Seed {
    return new Seed(bytesToHexString(Uint8Array.wrap(String.UTF8.encode(str))))
  }

  static from<T extends Byteable>(t: T): Seed {
    return new Seed(bytesToHexString(t.toBytes()))
  }
}

@json
export class SvmFindProgramAddressParams {
  public readonly seeds: Seed[]
  public readonly programId: string

  constructor(seeds: Seed[], programId: string) {
    this.seeds = seeds.slice()
    this.programId = programId
  }
}

export class SvmFindProgramAddressResult {
  constructor(
    public address: Address,
    public bump: u8
  ) {}

  static fromString(json: string): SvmFindProgramAddressResult {
    const object = JSON.parse<SvmFindProgramAddressStringResult>(json)
    return new SvmFindProgramAddressResult(Address.fromString(object.address), object.bump)
  }
}

@json
class SvmFindProgramAddressStringResult {
  constructor(
    public address: string,
    public bump: u8
  ) {}
}
