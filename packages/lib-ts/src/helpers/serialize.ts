import { Address, BigInt, Bytes } from '../types'

const SEPARATOR = ','

interface Stringable {
  toString(): string
}

export function serialize<T extends Stringable>(elem: T): string {
  if (elem instanceof Address || elem instanceof Bytes) return elem.toHexString()
  if (elem instanceof BigInt) return 'BigInt(' + elem.toString() + ')'
  return elem.toString()
}

export function join(lst: (string | null)[]): string {
  return lst.join(SEPARATOR)
}
