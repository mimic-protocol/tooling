import { Bytes } from '../types'

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
