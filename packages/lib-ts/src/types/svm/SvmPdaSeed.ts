import { Byteable, bytesToHexString } from '../../helpers'

/**
 * Type for findProgramAddress seeds
 * As we need all seeds to be decoded as bytes in the same way as in Rust,
 * this class provides a simple interface for end-users to abstract all this
 */
@json
export class SvmPdaSeed {
  constructor(public readonly hex: string) {}

  static fromString(str: string): SvmPdaSeed {
    return new SvmPdaSeed(bytesToHexString(Uint8Array.wrap(String.UTF8.encode(str))))
  }

  static from<T extends Byteable>(t: T): SvmPdaSeed {
    return new SvmPdaSeed(bytesToHexString(t.toBytes()))
  }
}
