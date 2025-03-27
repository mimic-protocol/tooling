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

export function serializeArray<T extends Stringable>(array: T[]): string {
  const serializedElems: (string | null)[] = []
  for (let i = 0; i < array.length; i++) {
    serializedElems.push(serialize(array[i]))
  }
  return 'Array(' + join(serializedElems) + ')'
}

export function join(lst: (string | null)[]): string {
  return lst.join(SEPARATOR)
}
