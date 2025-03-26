export const SEPARATOR = ','

interface Stringable {
  toString(): string
}

export interface Serializable {
  serialize(): string
}

export function serialize<T extends Stringable>(elem: T): string {
  // eslint-disable-next-line
  // @ts-ignore
  if (elem instanceof Serializable) return elem.serialize()
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
