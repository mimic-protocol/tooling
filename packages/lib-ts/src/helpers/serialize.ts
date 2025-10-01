import { evm } from '../evm'
import { BigInt, Bytes, EvmDecodeParam } from '../types'

export interface Stringable {
  toString(): string
}

export interface Serializable {
  serialize(): string
}

export interface Byteable {
  toBytes(): Bytes
}

export function serialize<T extends Stringable>(elem: T): string {
  // eslint-disable-next-line
  // @ts-ignore
  if (elem instanceof Serializable) return elem.serialize()
  return elem.toString()
}

export function deserializeCronTriggerData(data: string): BigInt {
  return BigInt.fromString(evm.decode(new EvmDecodeParam('uint256', data)))
}
