import { Address, ByteArray, Bytes } from './common'

export declare namespace environment {
  function getValue(): i32
  function createIntent(intent: i32): void
}

export { Address, ByteArray, Bytes }
